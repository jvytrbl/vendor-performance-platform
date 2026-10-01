// GET request :  getting vendors from the database
import { NextResponse } from "next/server";
import { withAuth } from "@/lib/withAuth";
import { validateVendorInput } from "../../../lib/domain/vendors/validateVendorInput";
import { findDuplicateVendor } from "../../../lib/domain/vendors/findDuplicateVendor";
import { getAllVendors, insertVendor, listVendors, type VendorRecord } from "@/lib/repositories/vendors";
import { parseVendorListSort } from "@/lib/domain/vendors/vendorListQuery";
import { parsePageParams } from "../../../lib/pagination/parsePageParams";
import { withAudit } from "@/lib/audit/withAudit";
import { getClientIp } from "@/lib/http/getClientIp";


export const GET = withAuth(async (request) => {
    const params = new URL(request.url).searchParams;
    const page = parsePageParams(params);
    if (!page.ok) {
        return NextResponse.json(
            { error: page.error, code: "VALIDATION_FAILED", field: page.field },
            { status: 400 }
        );
    }
    const search = params.get("q")?.trim() || undefined;
    const sort = parseVendorListSort({
        sortBy: params.get("sortBy"),
        sortOrder: params.get("sortOrder"),
    });
    if (!sort.ok) {
        return NextResponse.json(
            { error: sort.error, code: "VALIDATION_FAILED", field: sort.field },
            { status: 400 }
        );
    }
    
    try {
        const result = await listVendors({
            search,
            limit: page.limit,
            offset: page.offset,
            sortBy: sort.sortBy,
            sortOrder: sort.sortOrder,
        });

        return NextResponse.json(result);
    } catch (error: unknown) {
        	return NextResponse.json({
                error: "Failed to fetch vendors",
                code: "INTERNAL_ERROR",
            }, { status: 500 });
    }
});

export const POST = withAuth(async (request, auth) => {
    //do vendor validation check
    const body = await request.json();
    const validation = validateVendorInput(body);

    if(!validation.valid){
        return NextResponse.json(
            {error : validation.error, code: validation.code, field: validation.field},
            { status: 400}
        );
    }

    //do vendor duplication check
    if (!body.confirmDuplicate) {
        const existingVendors = await getAllVendors();
        const duplicate = findDuplicateVendor(validation.data.name, existingVendors);
        if (duplicate) {
            return NextResponse.json(
                { possibleDuplicate: duplicate},
                { status: 409 }
            );
        }
    }

    //finally, create the vendor and insert into db table VENDOR
    try {
        const created = await withAudit<VendorRecord>(
            {
                auth,
                action: "vendor.created",
                targetType: "Vendor",
                targetId: (result) => result.id,
                ipAddress: getClientIp(request),
            },
            (executor) => insertVendor(validation.data, executor)
        );
        return NextResponse.json({ data: created }, {status:201});
    } catch (error:any){
        if (error.number === 2627) {
            return NextResponse.json(
                {
                    error: "Registration number already in use",
                    code: "DUPLICATE_REGISTRATION",
                    field: "registration_number"
                },
                { status: 409 }
            );
        }
        throw  error;
    }
});