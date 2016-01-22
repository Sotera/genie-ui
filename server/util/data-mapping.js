// def: util for ES type mapping
'use strict';

module.exports = {
  getEventTypeMapping: () => {
    return {
      event: {
        properties: {
          indexed_date: {
            type: "date",
            format: "date_optional_time"
          },
          post_date: {
            type: "date",
            format: "date_optional_time"
          }
        }
      }
    };
  }
};
