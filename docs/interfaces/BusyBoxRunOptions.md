[@zorse/drop](../README.md) / [Exports](../modules.md) / BusyBoxRunOptions

# Interface: BusyBoxRunOptions

Options to run a "busybox" command (POSIX subset emulation)

## Hierarchy

- [`RunOptions`](RunOptions.md)

  ↳ **`BusyBoxRunOptions`**

## Table of contents

### Properties

- [Module](BusyBoxRunOptions.md#module)
- [args](BusyBoxRunOptions.md#args)
- [variant](BusyBoxRunOptions.md#variant)

## Properties

### Module

• `Optional` `Readonly` **Module**: `Object`

#### Defined in

[index.ts:88](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L88)

___

### args

• `Optional` `Readonly` **args**: `string`[]

Command line arguments

#### Inherited from

[RunOptions](RunOptions.md).[args](RunOptions.md#args)

#### Defined in

[index.ts:31](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L31)

___

### variant

• `Optional` `Readonly` **variant**: [`ABIVariant`](../modules.md#abivariant)

ABI variant to use

#### Inherited from

[RunOptions](RunOptions.md).[variant](RunOptions.md#variant)

#### Defined in

[index.ts:33](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L33)
