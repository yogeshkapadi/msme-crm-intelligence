const FORM_ID = '1G5afC2nbzKOGli8-OHOC7NaltnrkicQQgJffiwKVveo';

function doPost(e) {
  try {
    // The GitHub site submits a normal HTML form POST (URL-encoded),
    // so read values from e.parameter. JSON is also supported for testing.
    let data = {};
    if (e && e.postData && e.postData.contents) {
      const contentType = (e.postData.type || '').toLowerCase();
      if (contentType.indexOf('application/json') !== -1) {
        data = JSON.parse(e.postData.contents);
      } else if (e.parameter) {
        data = e.parameter;
      }
    } else if (e && e.parameter) {
      data = e.parameter;
    }

    const form = FormApp.openById(FORM_ID);
    const items = form.getItems();
    const response = form.createResponse();

    items.forEach(function(item) {
      const title = item.getTitle().trim();
      const value = data[title];

      if (value === undefined || value === null || value === '') return;

      switch (item.getType()) {
        case FormApp.ItemType.TEXT:
          response.withItemResponse(
            item.asTextItem().createResponse(String(value))
          );
          break;
        case FormApp.ItemType.MULTIPLE_CHOICE:
          response.withItemResponse(
            item.asMultipleChoiceItem().createResponse(String(value))
          );
          break;
        case FormApp.ItemType.PARAGRAPH_TEXT:
          response.withItemResponse(
            item.asParagraphTextItem().createResponse(String(value))
          );
          break;
      }
    });

    response.submit();

    return ContentService
      .createTextOutput(JSON.stringify({success: true}))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({success: false, error: error.toString()}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
