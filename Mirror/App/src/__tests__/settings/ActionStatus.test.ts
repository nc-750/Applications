import { describe, it, expect } from "vitest";
import { idleActionStatus, useActionStatus } from "../../settings/composables";

describe("idleActionStatus", () => {
    it("returns idle — the one honest default", () => {
        const status = idleActionStatus();
        expect(status.kind).toBe("idle");
    });
});

describe("useActionStatus", () => {
    it("initial state is honest idle", () => {
        const holder = useActionStatus();
        expect(holder.status.kind).toBe("idle");
    });

    it("toError(message) preserves the exact real message and lands in the error case", () => {
        const holder = useActionStatus();
        holder.toRunning();
        holder.toError("Save failed: disk full");
        expect(holder.status.kind).toBe("error");
        if (holder.status.kind === "error") {
            expect(holder.status.message).toBe("Save failed: disk full");
        }
    });

    it("success is reachable only via explicit toSuccess() (from running)", () => {
        const holder = useActionStatus();
        // Fresh holder must not start at success
        expect(holder.status.kind).not.toBe("success");
        // Only after explicit toRunning() + toSuccess() does success appear
        holder.toRunning();
        expect(holder.status.kind).toBe("running");
        holder.toSuccess();
        expect(holder.status.kind).toBe("success");
    });

    it("reset() returns to idle and clears any prior error message", () => {
        const holder = useActionStatus();
        holder.toRunning();
        holder.toError("Something broke");
        expect(holder.status.kind).toBe("error");
        holder.reset();
        expect(holder.status.kind).toBe("idle");
        // No leftover message field — kind is idle, not error
        expect("message" in holder.status).toBe(false);
    });

    it("each holder owns a fresh ref — two holders transition independently", () => {
        const a = useActionStatus();
        const b = useActionStatus();

        a.toRunning();
        expect(a.status.kind).toBe("running");
        // b must be unaffected
        expect(b.status.kind).toBe("idle");

        b.toError("b's error");
        expect(b.status.kind).toBe("error");
        // a must be unaffected
        expect(a.status.kind).toBe("running");
    });
});
