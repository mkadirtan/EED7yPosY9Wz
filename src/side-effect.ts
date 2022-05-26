import * as IORedis from 'ioredis';

/**
 * https://github.com/luin/ioredis/issues/407#issuecomment-506935242
 */
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const lastFunc = IORedis.Command._transformer.reply['hgetall'];
IORedis.Command.setReplyTransformer('hgetall', result => {
  if (typeof lastFunc === 'function') {
    result = lastFunc(result);
  }
  if (Object.keys(result).length === 0) {
    return null;
  }
  return result;
});
