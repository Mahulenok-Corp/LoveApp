export function validateNum(n: any) {
  if (!(!isNaN(parseFloat(n)) && isFinite(n))) {
    throw new Error("Not a number");
  }
}

export function validateNumNoError(n: any) {
  if (!(!isNaN(parseFloat(n)) && isFinite(n))) {
    return false;
  }
  return true;
}
