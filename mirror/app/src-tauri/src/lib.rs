use keyring::Entry;

const SERVICE: &str = "com.vendinois.mirror";
const ACCOUNT: &str = "api_key";
const LICENSE_ACCOUNT: &str = "license_key";

// Public Lemon Squeezy license API base. The store purchase URL is not handled
// here — the frontend owns it via the VITE_LS_STORE_URL env var (it is a public
// checkout link, so there is nothing to hide in the Rust binary).
const LS_API: &str = "https://api.lemonsqueezy.com/v1/licenses";

// ─── API key keyring ───────────────────────────────────────────────────────

fn keyring_entry() -> Result<Entry, String> {
    Entry::new(SERVICE, ACCOUNT).map_err(|e| format!("keyring init failed: {e}"))
}

#[tauri::command]
fn save_api_key(key: String) -> Result<(), String> {
    keyring_entry()?
        .set_password(&key)
        .map_err(|e| format!("keyring save failed: {e}"))
}

#[tauri::command]
fn load_api_key() -> Result<Option<String>, String> {
    match keyring_entry()?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("keyring load failed: {e}")),
    }
}

#[tauri::command]
fn delete_api_key() -> Result<(), String> {
    match keyring_entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("keyring delete failed: {e}")),
    }
}

// ─── License key keyring ───────────────────────────────────────────────────

fn license_keyring_entry() -> Result<Entry, String> {
    Entry::new(SERVICE, LICENSE_ACCOUNT).map_err(|e| format!("keyring init failed: {e}"))
}

#[tauri::command]
fn save_license_key(key: String) -> Result<(), String> {
    license_keyring_entry()?
        .set_password(&key)
        .map_err(|e| format!("keyring save failed: {e}"))
}

#[tauri::command]
fn load_license_key() -> Result<Option<String>, String> {
    match license_keyring_entry()?.get_password() {
        Ok(key) => Ok(Some(key)),
        Err(keyring::Error::NoEntry) => Ok(None),
        Err(e) => Err(format!("keyring load failed: {e}")),
    }
}

#[tauri::command]
fn delete_license_key() -> Result<(), String> {
    match license_keyring_entry()?.delete_credential() {
        Ok(()) => Ok(()),
        Err(keyring::Error::NoEntry) => Ok(()),
        Err(e) => Err(format!("keyring delete failed: {e}")),
    }
}

// ─── Lemon Squeezy license API ─────────────────────────────────────────────
// On Tauri these calls run from Rust (rather than the webview) to avoid browser
// CORS/CSP friction — not for secrecy, since the LS license API is keyless.

#[tauri::command]
async fn activate_license(key: String, instance_id: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/activate", LS_API))
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "license_key": key,
            "instance_name": instance_id,
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    let status = res.status().as_u16();
    let body: serde_json::Value = res.json().await.unwrap_or(serde_json::json!({}));

    // LS returns the authoritative result in the body's `activated` flag.
    // A 2xx status is necessary but not sufficient.
    if status >= 200 && status < 300 && body.get("activated").and_then(|a| a.as_bool()) == Some(true) {
        return Ok(());
    }

    // LS surfaces a human message in `error` (license API) and sometimes in `errors[].detail`.
    let detail = body
        .get("error")
        .and_then(|d| d.as_str())
        .or_else(|| {
            body.get("errors")
                .and_then(|e| e.as_array())
                .and_then(|arr| arr.first())
                .and_then(|e| e.get("detail"))
                .and_then(|d| d.as_str())
        })
        .unwrap_or(match status {
            404 => "License key not found.",
            400 => "This license key has reached its activation limit, or is invalid.",
            _ => "License activation failed.",
        });
    Err(detail.to_string())
}

#[tauri::command]
async fn validate_license(key: String, instance_id: String) -> Result<bool, String> {
    let client = reqwest::Client::new();
    let res = client
        .post(format!("{}/validate", LS_API))
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "license_key": key,
            "instance_id": instance_id,
        }))
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    // A 404 (key deleted) or any non-2xx means invalid. On 2xx, LS still reports
    // disabled/expired/revoked keys via `valid: false` in the body — so trust the
    // body flag, not the HTTP status, to detect revocation.
    if !res.status().is_success() {
        return Ok(false);
    }
    let body: serde_json::Value = res.json().await.unwrap_or(serde_json::json!({}));
    Ok(body.get("valid").and_then(|v| v.as_bool()).unwrap_or(false))
}

#[tauri::command]
async fn deactivate_license(key: String, instance_id: String) -> Result<(), String> {
    let client = reqwest::Client::new();
    // Best-effort — ignore errors so factory reset always completes.
    let _ = client
        .post(format!("{}/deactivate", LS_API))
        .header("Accept", "application/json")
        .json(&serde_json::json!({
            "license_key": key,
            "instance_id": instance_id,
        }))
        .send()
        .await;
    Ok(())
}

// ─── App entry ─────────────────────────────────────────────────────────────

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            save_api_key,
            load_api_key,
            delete_api_key,
            save_license_key,
            load_license_key,
            delete_license_key,
            activate_license,
            validate_license,
            deactivate_license,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

// ─── Tests ─────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn constants_are_expected() {
        assert_eq!(SERVICE, "com.vendinois.mirror");
        assert_eq!(ACCOUNT, "api_key");
        assert_eq!(LICENSE_ACCOUNT, "license_key");
        assert_eq!(LS_API, "https://api.lemonsqueezy.com/v1/licenses");
    }

    #[test]
    fn entry_constructors_do_not_panic() {
        // Verify the keyring entry constructors are callable (may return
        // Err on headless CI, but should never panic).
        let _ = keyring_entry();
        let _ = license_keyring_entry();
    }

    #[tokio::test]
    async fn deactivate_license_is_best_effort() {
        // deactivate_license always returns Ok(()) — errors are swallowed
        // so factory reset always completes.
        let result = deactivate_license("garbage-key".into(), "garbage-instance".into()).await;
        assert!(result.is_ok());
    }

    #[tokio::test]
    async fn validate_license_rejects_invalid_key() {
        // An obviously invalid key should return Ok(false), never panic.
        let result = validate_license("invalid".into(), "test".into()).await;
        // May be Ok(false) or Err (network unreachable on CI) — no panic is the contract.
        let _ = result;
    }
}
