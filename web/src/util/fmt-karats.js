export function fmtKarats(balance, cur = false) {
  if (balance == null) return null
  return [
    String(balance).replace(/0+$/, "").replace(/\.$/, ""),
    cur && "KARATS",
  ]
    .filter(Boolean)
    .join(" ")
}
