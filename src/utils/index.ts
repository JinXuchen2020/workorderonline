export const USER_PROFILE = 'userProfile'
export const RESPONSIVE_THRESHOLD = 415

export const isOfType = <T>(item: any, itemKey : keyof T) : item is T => {
  return item[itemKey] !== undefined
}

export const isWxBrowser = () => {
  const ua = navigator.userAgent.toLowerCase();

  const regex = ua.match(/MicroMessenger/i);
  if(regex && regex.length > 0 && regex[0] === "micromessenger") {
    return true
  }
  else {
    return false
  }
}