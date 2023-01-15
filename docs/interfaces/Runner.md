[@zorse/drop](../README.md) / [Exports](../modules.md) / Runner

# Interface: Runner

Runner lets you decide late execution of of commands

## Table of contents

### Properties

- [instance](Runner.md#instance)

### Methods

- [exec](Runner.md#exec)

## Properties

### instance

• `Readonly` **instance**: `object`

Underlying native instance

#### Defined in

[index.ts:23](https://github.com/zorse-lang/drop/blob/d9b8ab3/src/npm/index.ts#L23)

## Methods

### exec

▸ **exec**(): `void` \| [`Promise`]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise )<`void`\>

Execute the command

#### Returns

`void` \| [`Promise`]( https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise )<`void`\>

#### Defined in

[index.ts:25](https://github.com/zorse-lang/drop/blob/d9b8ab3/src/npm/index.ts#L25)
