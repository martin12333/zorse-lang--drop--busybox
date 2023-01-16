[@zorse/drop](../README.md) / [Exports](../modules.md) / DropRunOptions

# Interface: DropRunOptions

Options to run a "dropbox" command (NodeJS subset emulation)

## Hierarchy

- [`RunOptions`](RunOptions.md)

  ↳ **`DropRunOptions`**

## Table of contents

### Properties

- [args](DropRunOptions.md#args)
- [buffer](DropRunOptions.md#buffer)
- [file](DropRunOptions.md#file)
- [variant](DropRunOptions.md#variant)

## Properties

### args

• `Optional` `Readonly` **args**: `string`[]

Command line arguments

#### Inherited from

[RunOptions](RunOptions.md).[args](RunOptions.md#args)

#### Defined in

[index.ts:31](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L31)

___

### buffer

• `Optional` `Readonly` **buffer**: `BufferSource`

Buffer as input to

#### Defined in

[index.ts:41](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L41)

___

### file

• `Readonly` **file**: `string`

File to run, can be .[cm]js, .[cm]ts, or .[cm]tsx

#### Defined in

[index.ts:39](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L39)

___

### variant

• `Optional` `Readonly` **variant**: [`ABIVariant`](../modules.md#abivariant)

ABI variant to use

#### Inherited from

[RunOptions](RunOptions.md).[variant](RunOptions.md#variant)

#### Defined in

[index.ts:33](https://github.com/zorse-lang/drop/blob/12551aa/src/npm/index.ts#L33)
