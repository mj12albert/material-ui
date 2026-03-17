/**
 * Removes event handlers from the given object.
 * A field is considered an event handler if it is a function with a name beginning with `on`.
 *
 * @param object Object to remove event handlers from.
 * @returns Object with event handlers removed.
 */
function omitEventHandlers<Props extends Record<string, unknown>>(object: Props | undefined) {
  if (object === undefined) {
    return {};
  }

  const result = {} as Partial<Props>;

  const keys = Object.keys(object);
  for (let i = 0; i < keys.length; i += 1) {
    const key = keys[i];
    if (
      !(
        key.charCodeAt(0) === 111 /* o */ &&
        key.charCodeAt(1) === 110 /* n */ &&
        key.charCodeAt(2) >= 65 /* A */ &&
        key.charCodeAt(2) <= 90 /* Z */ &&
        typeof object[key] === 'function'
      )
    ) {
      (result[key] as any) = object[key];
    }
  }

  return result;
}

export default omitEventHandlers;
