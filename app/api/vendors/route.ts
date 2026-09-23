// GET request :  getting vendors from the database
import { NextResponse } from "next/server";
import { validateAuthHeader } from "@/lib/auth";
import { validateVendorInput } from "../../../lib/domain/vendors/validateVendorInput";
import { findDuplicateVendor } from "../../../lib/domain/vendors/findDuplicateVendor";
import { getAllVendors, insertVendor, listVendors } from "@/lib/repositories/vendors";
import { parsePageParams } from "../../../lib/pagination/parsePageParams";


export async function GET(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const authResult = await validateAuthHeader(authHeader);

    if(!authResult.valid) {
        return NextResponse.json(
            { error: authResult.reason ?? "Unauthorized", code: "UNAUTHORIZED"},
            { status: 401}
        );
    }

    const params = new URL(request.url).searchParams;
    const page = parsePageParams(params);
    if (!page.ok) {
        return NextResponse.json(
            { error: page.error, code: "VALIDATION_FAILED", field: page.field },
            { status: 400 }
        );
    }
    const search = params.get("q")?.trim() || undefined;
    
    try {
        const result = await listVendors({
            search,
            limit: page.limit,
            offset: page.offset,
        });

        return NextResponse.json(result);
    } catch (error: unknown) { 
        	return NextResponse.json({
                error: "Failed to fetch vendors",
                code: "INTERNAL_ERROR",
            }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const authHeader = request.headers.get("Authorization");
    const authResult = await validateAuthHeader(authHeader);

    if(!authResult.valid) {
        return NextResponse.json(
            { error: authResult.reason ?? "Unauthorized", code: "UNAUTHORIZED"},
            { status: 401},
        );
    }
    
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
        const created = await insertVendor(validation.data);
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
}