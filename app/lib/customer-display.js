/**
 * Derive a display name from `orders.customer_data`.
 * Checkout saves firstName, lastName, epicUsername, email, id — not `name`.
 * @param {Record<string, unknown> | null | undefined} customer
 * @returns {string}
 */
export function getCustomerDisplayName(customer) {
  if (!customer || typeof customer !== "object") return "Client";

  const rawName = customer.name;
  if (typeof rawName === "string" && rawName.trim()) return rawName.trim();

  const first = typeof customer.firstName === "string" ? customer.firstName.trim() : "";
  const last = typeof customer.lastName === "string" ? customer.lastName.trim() : "";
  const full = [first, last].filter(Boolean).join(" ");
  if (full) return full;

  const displayName = customer.displayName;
  if (typeof displayName === "string" && displayName.trim()) return displayName.trim();

  const epic = customer.epicUsername;
  if (typeof epic === "string" && epic.trim()) return epic.trim();

  const email = customer.email;
  if (typeof email === "string" && email.trim()) return email.trim();

  return "Client";
}

/**
 * Lowercase string for search (name + email + epic).
 * @param {Record<string, unknown> | null | undefined} customer
 */
export function getCustomerSearchBlob(customer) {
  if (!customer || typeof customer !== "object") return "";
  const parts = [
    customer.name,
    customer.firstName,
    customer.lastName,
    customer.displayName,
    customer.epicUsername,
    customer.email,
  ];
  return parts.filter(Boolean).join(" ").toLowerCase();
}
