import { Children, Fragment, cloneElement, isValidElement, type ReactElement, type ReactNode } from 'react';

type Element = ReactElement<Record<string, unknown>>;
/** Keep a keyed fragment's identity when exposing its rows to table view modes. */
export function recordElements(children: ReactNode, parentKey = ''): Element[] {
  return Children.toArray(children).flatMap(child => {
    if (!isValidElement(child)) return [];
    const element = child as Element;
    if (element.type === Fragment) {
      return recordElements(element.props.children as ReactNode, `${parentKey}${element.key}/`);
    }
    return [parentKey ? cloneElement(element, { key: `${parentKey}${element.key}` }) : element];
  });
}
