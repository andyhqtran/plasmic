import * as React from 'react';
import { Renderer, Overrides } from '@plasmicapp/react-web';
import { FocusableRefValue, HoverEvents } from '@react-types/shared';
import {
  VariantDefTuple,
  StyleProps,
  mergeVariantDefTuples,
  mergeProps,
  PlasmicClass,
  RendererArgs,
  RendererOverrides,
  RendererVariants,
} from '../common';
import { AriaTextFieldProps } from '@react-types/textfield';
import { useTextField as useAriaTextField } from '@react-aria/textfield';
import { createFocusableRef } from '@react-spectrum/utils';
import pick from 'lodash-es/pick';
import commonStyles from '../common.module.css';
import { useHover } from '@react-aria/interactions';

export type PlumeTextFieldProps = AriaTextFieldProps &
  StyleProps &
  HoverEvents & {
    selectAllOnFocus?: boolean;
    startIcon?: React.ReactNode;
    endIcon?: React.ReactNode;
  };

export interface PlumeTextFieldRefValue
  extends FocusableRefValue<HTMLInputElement, HTMLDivElement> {
  select(): void;
  UNSAFE_getInputElement(): HTMLInputElement;
}

export type PlumeTextFieldRef = React.Ref<PlumeTextFieldRefValue>;

export interface PlumeTextFieldConfig<R extends Renderer<any, any, any, any>> {
  isDisabledVariant?: VariantDefTuple<RendererVariants<R>>;
  hasLabelVariant?: VariantDefTuple<RendererVariants<R>>;
  showStartIconVariant?: VariantDefTuple<RendererVariants<R>>;
  showEndIconVariant?: VariantDefTuple<RendererVariants<R>>;

  labelSlot?: keyof RendererArgs<R>;
  startIconSlot?: keyof RendererArgs<R>;
  endIconSlot?: keyof RendererArgs<R>;

  root: keyof RendererOverrides<R>;
  textbox: keyof RendererOverrides<R>;
  label?: keyof RendererOverrides<R>;
}

export function useTextField<
  P extends PlumeTextFieldProps,
  R extends Renderer<any, any, any, any>
>(
  plasmicClass: PlasmicClass<R>,
  props: P,
  config: PlumeTextFieldConfig<R>,
  ref: PlumeTextFieldRef = null
) {
  const renderer = plasmicClass.createRenderer();
  const {
    isDisabled,
    selectAllOnFocus,
    className,
    style,
    startIcon,
    endIcon,
    label,
  } = props;
  const inputRef = React.useRef<HTMLInputElement>(null);
  const { labelProps, inputProps } = useAriaTextField(props, inputRef);
  const { hoverProps } = useHover(props);

  const rootRef = React.useRef<HTMLDivElement>(null);

  // Expose imperative interface for ref
  React.useImperativeHandle(ref, () => ({
    ...createFocusableRef(rootRef, inputRef),
    focus() {
      if (inputRef.current) {
        inputRef.current.focus();
        if (selectAllOnFocus) {
          inputRef.current.select();
        }
      }
    },
    select() {
      if (inputRef.current) {
        inputRef.current.select();
      }
    },
    UNSAFE_getInputElement() {
      return inputRef.current as HTMLInputElement;
    },
  }));

  const variants = {
    ...pick(props, ...renderer.getInternalVariantProps()),
    ...mergeVariantDefTuples([
      isDisabled && config.isDisabledVariant,
      label && config.hasLabelVariant,
      startIcon && config.showStartIconVariant,
      endIcon && config.showEndIconVariant,
    ]),
  };

  const args = {
    ...pick(props, ...renderer.getInternalArgProps()),
    ...config.labelSlot && {[config.labelSlot]: label},
    ...config.startIconSlot && {[config.startIconSlot]: startIcon},
    ...config.endIconSlot && {[config.endIconSlot]: endIcon},
  };

  const overrides: Overrides = {
    [config.root]: mergeProps(hoverProps, {
      ref: rootRef,
      className,
      style,
    }),
    [config.textbox]: {
      ref: inputRef,
      ...mergeProps(inputProps, {
        className: commonStyles.noOutline,
        onFocus: (e: FocusEvent) => {
          if (selectAllOnFocus && inputRef.current) {
            inputRef.current.select();
          }
        },
      }),
    },
    ...(config.label
      ? {
          [config.label]: {
            as: 'label',
            props: {
              ...labelProps,
            },
          },
        }
      : {}),
  };

  return {
    plumeProps: {
      variants: variants as RendererVariants<R>,
      args: args as RendererArgs<R>,
      overrides: overrides as RendererOverrides<R>,
    },
  };
}