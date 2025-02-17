import { compareToken } from '../basics/token';
import { BaseReferenceObject, FunctionVariantType } from '../reference-object/base-reference-object';
import { ArrayValueObject } from '../value-object/array-value-object';
import { BaseValueObject } from '../value-object/base-value-object';
import { BooleanValueObject, NumberValueObject } from '../value-object/primitive-object';
import { BaseFunction } from './base-function';

export class Max extends BaseFunction {
    override calculate(...variants: FunctionVariantType[]) {
        let accumulatorAll: BaseValueObject = new NumberValueObject(-Infinity);
        for (let i = 0; i < variants.length; i++) {
            const variant = variants[i];

            if (variant.isReferenceObject() || (variant.isValueObject() && (variant as BaseValueObject).isArray())) {
                (variant as BaseReferenceObject | ArrayValueObject).iterator((valueObject, row, column) => {
                    if (!valueObject.isErrorObject() && !(valueObject as BaseValueObject).isString()) {
                        accumulatorAll = this._validator(accumulatorAll, valueObject as BaseValueObject);
                    }
                });
            } else if (!(variant as BaseValueObject).isString()) {
                accumulatorAll = this._validator(accumulatorAll, variant as BaseValueObject);
            }
        }

        return accumulatorAll;
    }

    private _validator(accumulatorAll: BaseValueObject, valueObject: BaseValueObject) {
        const validator = accumulatorAll.compare(
            valueObject as BaseValueObject,
            compareToken.LESS_THAN
        ) as BooleanValueObject;
        if (validator.getValue()) {
            accumulatorAll = valueObject as BaseValueObject;
        }
        return accumulatorAll;
    }
}
