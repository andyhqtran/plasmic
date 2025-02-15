import { CSSProperties } from "@plasmicapp/host/dist/element-types";
import registerComponent, { ComponentMeta } from "@plasmicapp/host/registerComponent";
import React from "react";
import { useProduct } from "./contexts";
import { Registerable } from "./registerable";

const placeholderImage = "https://static1.plasmic.app/commerce/lightweight-jacket-0.png"

interface ProductMediaProps {
  className: string;
  mediaIndex?: number;
}

export const productMediaMeta: ComponentMeta<ProductMediaProps> = {
  name: "plasmic-commerce-product-media",
  displayName: "Product Media",
  props: {
    mediaIndex: "number",
  },
  importPath: "@plasmicpkgs/commerce",
  importName: "ProductMedia",
};

export function ProductMedia(props: ProductMediaProps) {
  const { className, mediaIndex = 0 } = props;

  const product = useProduct();

  const image = product?.images[mediaIndex];
  return (
    <img
      alt={product?.name || 'Product Image'}
      src={product ? (image?.url ?? "") : placeholderImage}
      loading={'lazy'}
      className={className}
    />
  )
}

export function registerProductMedia(
  loader?: Registerable,
  customProductMediaMeta?: ComponentMeta<ProductMediaProps>
) {
  const doRegisterComponent: typeof registerComponent = (...args) =>
    loader ? loader.registerComponent(...args) : registerComponent(...args);
  doRegisterComponent(ProductMedia, customProductMediaMeta ?? productMediaMeta);
}
