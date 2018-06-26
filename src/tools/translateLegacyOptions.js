export default function translateLegacyOptions({
  options: legacy,
  ...newOptions
}) {
  return {
    legacy,
    newOptions,
  };
}
