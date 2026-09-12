import type { LinkProps as NextLinkProps } from "next/dist/client/link.js";
import type { UrlObject } from "url";

declare module "next/link" {
  export type LinkProps<RouteInferType = string> = Omit<
    NextLinkProps,
    "href"
  > & {
    href: string | UrlObject;
  };

  export default function Link(props: LinkProps): JSX.Element;
}
