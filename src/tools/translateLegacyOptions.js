export default function translateLegacyOptions({
  options: legacy,
  ...newOptions
}) {
  return {
    legacy: legacy || {
      pdfOptions: {},
      screenshotOptions: {},
      gotoOptions: {},
    },
    newOptions,
  };
}
