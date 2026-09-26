function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('図形のへんしん実験室')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
