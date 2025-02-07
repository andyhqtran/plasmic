import { Registerable } from "./registerable";
import React from "react";
import { getCommerceProvider } from "./shopify";
import { GlobalContextMeta } from "@plasmicapp/host";
import registerGlobalContext from "@plasmicapp/host/registerGlobalContext";

interface CommerceProviderProps {
  children?: React.ReactNode;
  storeDomain: string;
  accessToken: string;

}
export const commerceProviderMeta: GlobalContextMeta<CommerceProviderProps> = {
  name: "plasmic-commerce-shopify-provider",
  displayName: "Shopify Provider",
  props: {
    storeDomain: "string",
    accessToken: "string"
  },
  description: `Your store domain should look like **storename.myshopify.com**.
    For your access token, get it by following [this video](https://www.youtube.com/watch?v=wB_6cM7tdv4).`,
  importPath: "commerce-providers/shopify",
  importName: "ShopifyProvider",
};

function CommerceProviderComponent(props: CommerceProviderProps) {
  const { storeDomain, accessToken, children } = props;

  const CommerceProvider = getCommerceProvider(storeDomain, accessToken);

  return (
    <CommerceProvider>
      {children}
    </CommerceProvider>
  )
}

export function registerCommerceProvider(
  loader?: Registerable,
  customCommerceProviderMeta?: GlobalContextMeta<CommerceProviderProps>
) {
  const doRegisterComponent: typeof registerGlobalContext = (...args) =>
    loader ? loader.registerGlobalContext(...args) : registerGlobalContext(...args);
  doRegisterComponent(CommerceProviderComponent, customCommerceProviderMeta ?? commerceProviderMeta);
}
