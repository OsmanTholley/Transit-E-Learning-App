import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export const DATABASE_OFFLINE_CODE = "DATABASE_OFFLINE";
export const DATABASE_OFFLINE_MESSAGE = "Check your internet and try again";

export const SCHEMA_OUT_OF_DATE_CODE = "SCHEMA_OUT_OF_DATE";
export const SCHEMA_OUT_OF_DATE_MESSAGE =
  "Database schema is out of date. From the project root run: npx prisma migrate deploy";

export class DatabaseUnavailableError extends Error {
  constructor(message = DATABASE_OFFLINE_MESSAGE) {
    super(message);
    this.name = "DatabaseUnavailableError";
  }
}

export function isSchemaOutOfDateError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2021" || error.code === "P2022";
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      (message.includes("column") && message.includes("does not exist")) ||
      (message.includes("table") && message.includes("does not exist")) ||
      message.includes("invalid input value for enum") ||
      message.includes('type "liveclassstatus" does not exist')
    );
  }
  return false;
}

export function isDatabaseConnectionError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P1001" ||
      error.code === "P1002" ||
      error.code === "P1017"
    );
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    const code = "code" in error ? String((error as NodeJS.ErrnoException).code ?? "").toLowerCase() : "";
    return (
      message.includes("can't reach database server") ||
      message.includes("can't reach database") ||
      message.includes("connection timed out") ||
      message.includes("connection refused") ||
      message.includes("network") ||
      message.includes("fetch failed") ||
      message.includes("econnrefused") ||
      message.includes("etimedout") ||
      message.includes("enotfound") ||
      message.includes("enetunreach") ||
      code === "econnrefused" ||
      code === "etimedout" ||
      code === "enotfound" ||
      code === "enetunreach"
    );
  }

  return false;
}

export function toDatabaseError(error: unknown): DatabaseUnavailableError | null {
  if (isDatabaseConnectionError(error)) {
    return new DatabaseUnavailableError();
  }
  return null;
}

export function databaseUnavailableResponse() {
  return NextResponse.json(
    { error: DATABASE_OFFLINE_MESSAGE, code: DATABASE_OFFLINE_CODE },
    { status: 503 }
  );
}

export function schemaOutOfDateResponse() {
  return NextResponse.json(
    { error: SCHEMA_OUT_OF_DATE_MESSAGE, code: SCHEMA_OUT_OF_DATE_CODE },
    { status: 503 }
  );
}

export function handleRouteDatabaseError(error: unknown) {
  if (isSchemaOutOfDateError(error)) {
    return schemaOutOfDateResponse();
  }
  if (toDatabaseError(error)) {
    return databaseUnavailableResponse();
  }
  return null;
}
