export const isJson = (obj: any) => {
  try {
    JSON.parse(obj);
  } catch (e) {
    return false;
  }
  return true;
};
