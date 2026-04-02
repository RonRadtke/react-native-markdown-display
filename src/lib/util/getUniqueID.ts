let uuid = Date.now();

export default function getUniqueID(): string {
  uuid += 1;
  return `rnmr_${uuid.toString(16)}`;
}
