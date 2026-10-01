import { describe, it, expect, vi, beforeEach } from "vitest";

const { poolMock, instances, logAuditMock } = vi.hoisted(() => {
  return {
    poolMock: { name: "pool" } as any,
    instances: [] as any[],
    logAuditMock: vi.fn(),
  };
});

function makeTransactionInstance() {
  const request: any = { input: vi.fn().mockReturnThis(), query: vi.fn().mockResolvedValue({}) };
  return {
    begin: vi.fn().mockResolvedValue(undefined),
    commit: vi.fn().mockResolvedValue(undefined),
    rollback: vi.fn().mockResolvedValue(undefined),
    request: vi.fn(() => request),
  };
}

vi.mock("@/lib/db", () => ({
  getDbPool: vi.fn().mockResolvedValue(poolMock),
}));

vi.mock("mssql", () => ({
  default: {
    Transaction: vi.fn().mockImplementation(() => {
      const instance = makeTransactionInstance();
      instances.push(instance);
      return instance;
    }),
  },
}));

vi.mock("./logAudit", () => ({
  logAudit: logAuditMock,
}));

const { withAudit } = await import("./withAudit");

const auth = {
  email: "someone@envirosgroup.com",
  oid: "11111111-1111-1111-1111-111111111111",
  tid: "13c2d626-295d-4ec6-8d56-556d53b94212",
};

describe("withAudit()", () => {
  beforeEach(() => {
    instances.length = 0;
    logAuditMock.mockReset();
    logAuditMock.mockResolvedValue(undefined);
  });

  it("commits once the mutation and the audit write both succeed, returning the mutation's result", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: 7, status: "Draft" });

    const result = await withAudit(
      { auth, action: "report.edited", targetType: "Report", targetId: 7, ipAddress: "203.0.113.5" },
      mutate
    );

    expect(result).toEqual({ id: 7, status: "Draft" });
    const tx = instances[0];
    expect(tx.begin).toHaveBeenCalled();
    expect(mutate).toHaveBeenCalledWith(tx);
    expect(logAuditMock).toHaveBeenCalledWith(tx, {
      userEmail: auth.email,
      userOid: auth.oid,
      userTid: auth.tid,
      action: "report.edited",
      targetType: "Report",
      targetId: 7,
      ipAddress: "203.0.113.5",
    });
    expect(tx.commit).toHaveBeenCalled();
    expect(tx.rollback).not.toHaveBeenCalled();
  });

  it("rolls back and never writes an audit row when the mutation itself fails", async () => {
    const mutationError = new Error("duplicate key");
    const mutate = vi.fn().mockRejectedValue(mutationError);

    await expect(
      withAudit(
        { auth, action: "report.created", targetType: "Report", targetId: 7, ipAddress: null },
        mutate
      )
    ).rejects.toThrow(mutationError);

    expect(logAuditMock).not.toHaveBeenCalled();
    const tx = instances[0];
    expect(tx.commit).not.toHaveBeenCalled();
    expect(tx.rollback).toHaveBeenCalled();
  });

  // THE most important test in this step: proves fail-closed actually works,
  // not just that the code intends it to. A mutation that itself succeeds
  // must still be rolled back — never committed — if writing its audit row
  // fails, so a mutation can never be saved without its audit entry.
  it("rolls back the ALREADY-SUCCESSFUL mutation when the audit write fails (fail-closed)", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: 7, status: "Draft" });
    const auditError = new Error("AUDIT_LOG insert failed");
    logAuditMock.mockRejectedValue(auditError);

    await expect(
      withAudit(
        { auth, action: "report.edited", targetType: "Report", targetId: 7, ipAddress: null },
        mutate
      )
    ).rejects.toThrow(auditError);

    expect(mutate).toHaveBeenCalled(); // the mutation DID run and DID succeed
    const tx = instances[0];
    expect(tx.commit).not.toHaveBeenCalled(); // yet it must never be committed
    expect(tx.rollback).toHaveBeenCalled(); // — it's rolled back instead
  });

  it("derives targetId from the mutation's own result when given as a function (create)", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: 42 });

    await withAudit(
      { auth, action: "report.created", targetType: "Report", targetId: (result: { id: number }) => result.id, ipAddress: null },
      mutate
    );

    expect(logAuditMock).toHaveBeenCalledWith(
      instances[0],
      expect.objectContaining({ targetId: 42 })
    );
  });

  it("rejects a fixed targetId of 0 before ever opening a transaction", async () => {
    const mutate = vi.fn();

    await expect(
      withAudit({ auth, action: "report.edited", targetType: "Report", targetId: 0, ipAddress: null }, mutate)
    ).rejects.toThrow(/positive integer/);

    expect(mutate).not.toHaveBeenCalled();
    expect(instances).toHaveLength(0);
  });

  it("rejects a fixed negative targetId before ever opening a transaction", async () => {
    const mutate = vi.fn();

    await expect(
      withAudit({ auth, action: "report.deleted", targetType: "Report", targetId: -1, ipAddress: null }, mutate)
    ).rejects.toThrow(/positive integer/);

    expect(mutate).not.toHaveBeenCalled();
  });

  it("rolls back when a derived targetId resolves to a non-positive value, even though the mutation already ran", async () => {
    const mutate = vi.fn().mockResolvedValue({ id: 0 });

    await expect(
      withAudit(
        { auth, action: "report.created", targetType: "Report", targetId: (result: { id: number }) => result.id, ipAddress: null },
        mutate
      )
    ).rejects.toThrow(/positive integer/);

    expect(logAuditMock).not.toHaveBeenCalled();
    const tx = instances[0];
    expect(tx.commit).not.toHaveBeenCalled();
    expect(tx.rollback).toHaveBeenCalled();
  });

  it("ignores any identity-shaped fields on the mutation's own result, using only auth for the audit entry", async () => {
    // Simulates an attacker-influenced mutation result that happens to carry
    // fields shaped like identity claims (e.g. echoing back request body
    // content) — withAudit must never read email/oid/tid from anywhere but
    // the verified `auth` parameter.
    const mutate = vi.fn().mockResolvedValue({
      id: 7,
      email: "attacker@evil.com",
      oid: "attacker-oid",
      tid: "attacker-tid",
    });

    await withAudit(
      { auth, action: "report.edited", targetType: "Report", targetId: 7, ipAddress: null },
      mutate
    );

    expect(logAuditMock).toHaveBeenCalledWith(
      instances[0],
      expect.objectContaining({
        userEmail: auth.email,
        userOid: auth.oid,
        userTid: auth.tid,
      })
    );
  });

  it("gives two concurrent calls their own transaction each — no shared state between them", async () => {
    const mutateA = vi.fn().mockResolvedValue({ id: 1 });
    const mutateB = vi.fn().mockResolvedValue({ id: 2 });

    await Promise.all([
      withAudit({ auth, action: "report.edited", targetType: "Report", targetId: 1, ipAddress: null }, mutateA),
      withAudit({ auth, action: "report.deleted", targetType: "Report", targetId: 2, ipAddress: null }, mutateB),
    ]);

    expect(instances).toHaveLength(2);
    expect(instances[0]).not.toBe(instances[1]);
    expect(logAuditMock).toHaveBeenCalledWith(instances[0], expect.objectContaining({ targetId: 1 }));
    expect(logAuditMock).toHaveBeenCalledWith(instances[1], expect.objectContaining({ targetId: 2 }));
    expect(instances[0].commit).toHaveBeenCalled();
    expect(instances[1].commit).toHaveBeenCalled();
  });
});
