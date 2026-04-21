export type Brand<T, B extends string> = T & { readonly __brand: B; readonly __baseType: T };

export type MakeBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: BrandType['__baseType'],
) => BrandType;

export type AssertBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => asserts value is BrandType;

export type IsBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => value is BrandType;

export type BrandClass<BrandType extends Brand<unknown, string>> = MakeBrandFunc<BrandType> & {
  assert: AssertBrandFunc<BrandType>;
  is: IsBrandFunc<BrandType>;
};
