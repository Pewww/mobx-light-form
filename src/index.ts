import isEmpty from 'lodash.isempty';
import { action, computed, makeObservable, observable } from 'mobx';

type CustomErrorMessage = string;

type CustomFuncValidation = (value: any) => [
  boolean,
  CustomErrorMessage | undefined
];

type Validation = RegExp | CustomFuncValidation;

type FormPrivateKeys = '_touched'
  | 'setTouched'
  | 'keys'
  | 'addKey'
  | '_errors'
  | 'setErrors';

export enum ERROR_MESSAGE {
  KEY_NOT_EXISTS = 'Key should exists.',
  VALUE_NOT_REQUIRED = 'Value should be required.',
  VALUE_NOT_VALID = 'Value is not valid.'
}

export interface FieldSource<T> {
  key: string; // Should be same as field name
  label: string;
  value: T;
  isRequired: boolean;
  validation: Validation[];
}

export default class Form {
  private _initialValues: Record<string, Partial<FieldSource<unknown>>> = {};

  private _touched: Record<string, boolean> = {};

  private _errors: Record<string, string | undefined> = {};

  private readonly keys: string[];

  constructor() {
    this.keys = [];

    makeObservable<Form, FormPrivateKeys>(this, {
      // observables
      _touched: observable,
      _errors: observable,
      keys: observable,

      // computed
      errors: computed,
      touched: computed,
      isValid: computed,
      
      // actions
      setTouched: action,
      setErrors: action,
      addKey: action,
      update: action,
      reset: action
    });
  }

  public static FIELD_DEFAULT_VALUES = {
    key: '',
    label: '',
    value: '',
    isRequired: false,
    validation: []
  };

  public get errors() {
    this.keys.forEach(key => {
      // @ts-ignore
      const _ = this[key];
      const target = _ as FieldSource<any>;

      if (target.isRequired && isEmpty(target.value)) {
        this._errors[key] = ERROR_MESSAGE.VALUE_NOT_REQUIRED;
        return;
      }

      if (!isEmpty(target.validation)) {
        const invalidIdx = target.validation.findIndex(v =>
          typeof v === 'function'
            ? !v(target.value)[0]
            : !v.test(target.value)
        );

        if (invalidIdx !== -1) {
          const invalidItem = target.validation[invalidIdx];

          const errorMessage = typeof invalidItem === 'function'
            ? invalidItem(target.value)[1] || ERROR_MESSAGE.VALUE_NOT_VALID
            : ERROR_MESSAGE.VALUE_NOT_VALID;
  
          this._errors[key] = errorMessage;
          return;
        }
      }

      // Set value(error) to undefined after passing all validations.
      this._errors[key] = undefined;
    });

    return this._errors;
  }

  public get touched() {
    return this._touched;
  }

  public get isValid() {
    for (const key of this.keys) {
      // @ts-ignore
      const _ = this[key];
      const target = _ as FieldSource<any>;
      
      if (target.isRequired && isEmpty(target.value)) {
        return false;
      }

      if (!isEmpty(target.validation)) {
        const isAllValidationPassed = target.validation.every((v) =>
          typeof v === 'function'
            ? v(target.value)[0]
            : v.test(target.value)
        );

        if (!isAllValidationPassed) {
          return false;
        }
      }
    }

    return true;
  }

  protected get initialValues() {
    return this._initialValues;
  }

  public update(changes: Record<string, any>) {
    Object.keys(changes).forEach(key => {
      if (key in this) {
        Object.assign(this, {
          [key]: {
            // @ts-ignore
            ...this[key],
            value: changes[key]
          }
        });
        
        this.setTouched(key, true);
      }
    });
  }

  public reset() {
    this.keys.forEach(key => {
      Object.assign(this, {
        [key]: this._initialValues[key]
      });

      this.setTouched(key, false);
      this.setErrors(key, undefined);
    });
  }

  protected generateField<T>(options: Partial<FieldSource<T>> & {
    key: string;
  }): FieldSource<T> {
    if (!options.key) {
      throw new Error(ERROR_MESSAGE.KEY_NOT_EXISTS);
    }

    this.addKey(options.key);
    this.setTouched(options.key, false);
    this.setErrors(options.key, undefined);

    const initialValue = {
      ...Form.FIELD_DEFAULT_VALUES,
      ...options,
      value: options.value ?? ''
    } as FieldSource<T>;

    this._initialValues = {
      ...this._initialValues,
      [options.key]: initialValue
    };

    return initialValue;
  }

  private addKey(key: string) {
    if (this.keys.includes(key)) {
      return;
    }

    this.keys.push(key);
  }

  private setTouched(key: string, value: boolean) {
    this._touched[key] = value;
  }
  
  private setErrors(key: string, value: string | undefined) {
    this._errors[key] = value;
  }
}
