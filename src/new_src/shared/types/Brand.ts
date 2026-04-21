// The actual Brand type
export type Brand<T, B extends string> = T & { readonly __brand: B; readonly __baseType: T };

type _MakeBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: BrandType['__baseType'],
) => BrandType;

type _AssertBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => asserts value is BrandType;

type _IsBrandFunc<BrandType extends Brand<unknown, string>> = (
  value: unknown,
) => value is BrandType;

// BrandFunc is an exported alias for _MakeBrandFunc
export type BrandFunc<BrandType extends Brand<unknown, string>> = _MakeBrandFunc<BrandType>;

// BrandMethods is an exported type for the static methods that should be on the brand class
export type BrandMethods<BrandType extends Brand<unknown, string>> = {
  readonly assert: _AssertBrandFunc<BrandType>;
  readonly is: _IsBrandFunc<BrandType>;
};

// BrandClass can be called as the original BrandFunc (make operation),
// but also has the static methods defined in BrandMethods attached to it.
export type BrandClass<BrandType extends Brand<unknown, string>> = _MakeBrandFunc<BrandType> &
  BrandMethods<BrandType>;
