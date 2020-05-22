// subclass that treats `referrer` and `referer` the same
export class WebHeaders extends Headers {
  get(name: string) {
    return super.get(handleReferer(name));
  }

  set(name: string, value: string) {
    return super.set(handleReferer(name), value);
  }

  append(name: string, value: string) {
    return super.append(handleReferer(name), value);
  }

  delete(name: string) {
    return super.delete(handleReferer(name));
  }
}

function handleReferer(name: string): string {
  if (name.toLowerCase() == "referer") {
    return "referrer";
  }
  return name;
}
