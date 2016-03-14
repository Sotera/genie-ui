// def: util for ES type mapping
'use strict';

module.exports = {
  // TODO: rm delete() in prod
  createIndexWithMapping: (options) => {
    const client = options.client,
      index = options.index,
      type = options.type,
      mapping = options.mapping;

    return client.indices.exists({index})
    .then(exists => {
      // delete if exists
      return (exists ? client.indices.delete({index}) : exists);
    })
    .then(() => client.indices.create({index}))
    .then(() => {
      return client.indices.putMapping({
        index,
        type,
        body: mapping
      });
    });
  },
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
