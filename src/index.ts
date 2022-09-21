import isEmpty from 'lodash.isempty';
import { action, computed, makeObservable, observable } from 'mobx';

type CustomErrorMessage = string;

type CustomFuncValidation = (value: any) => [
  boolean,
  CustomErrorMessage | undefined
];

type CustomAsyncFuncValidation = (value: any) => Promise<[
  boolean,
  CustomErrorMessage | undefined
]>;

type Validation = RegExp | CustomFuncValidation | CustomAsyncFuncValidation;

type FormPrivateKeys = '_touched'
  | 'setTouched'
  | 'keys'
  | 'addKey'
  | '_errors'
  | 'setErrors';

export enum ERROR_TYPE {
  KEY_NOT_EXISTS = 'Key should exists.',
  VALUE_NOT_REQUIRED = 'Value should be required.',
  VALUE_NOT_VALID = 'Value is not valid.'
}

export interface FieldSource<T> {
  key: string; // Should be same as field name
  label: string;
  value: T;
  isRequired: boolean;
  requiredMessage?: string;
  validation: Validation[];
}

export default class Form {
  private _initialValues: Record<string, Partial<FieldSource<unknown>>> = {};

  private _touched: Record<string, boolean> = {};

  private _errors: Record<string, string | undefined> = {};

  private readonly __identifier: string;

  private readonly keys: string[];

  constructor() {
    this.keys = [];

    this.__identifier = this.getUniqueId();

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
      clear: action,
      reset: action,
      untouch: action,
      untouchAll: action,
      validate: action
    });
  }

  public static FIELD_DEFAULT_VALUES = {
    key: '',
    label: '',
    value: '',
    isRequired: false,
    requiredMessage: undefined,
    validation: []
  };

  public get __id() {
    return this.__identifier;
  }

  public get errors() {
    return this._errors;
  }

  public get touched() {
    return this._touched;
  }

  public get isValid() {
    return Object.values(this._errors).every(e => e === undefined);
  }

  protected get initialValues() {
    return this._initialValues;
  }

  public update(changes: Record<string, any>, withoutValidation?: boolean) {
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

        if (!withoutValidation) {
          this.validateField(key);
        }
      }
    });
  }

  public clear() {
    this.keys.forEach(key => {
      Object.assign(this, {
        [key]: this._initialValues[key]
      });

      this.setTouched(key, false);
      this.validateField(key, this._initialValues[key] as FieldSource<any>);
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

  public untouch(key: string) {
    if (key in this) {
      this.setTouched(key, false);
    }
  }

  public untouchAll() {
    this.keys.forEach(key => {
      this.setTouched(key, false);
    });
  }

  public async validate() {
    for (const key of this.keys) {
      await this.validateField(key);
    }
  }

  protected generateField<T>(
    options: Partial<FieldSource<T>> & {
      key: string;
    },
    withoutInitialValidation?: boolean
  ): FieldSource<T> {
    if (!options.key) {
      throw new Error(ERROR_TYPE.KEY_NOT_EXISTS);
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

    if (!withoutInitialValidation) {
      this.validateField(options.key, initialValue);
    }

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

  private async validateField(key: string, _target?: FieldSource<any>) {
    // @ts-ignore
    const _ = this[key];
    const target = _target ?? _ as FieldSource<any>;

    if (target.isRequired && isEmpty(target.value)) {
      this._errors[key] = target.requiredMessage ?? ERROR_TYPE.VALUE_NOT_REQUIRED;
      return;
    }

    if (!isEmpty(target.validation)) {
      for (const v of target.validation) {
        const validationResult = await (typeof v === 'function'
          ? v(target.value)
          : v.test(target.value)
        );

        // For function validation result
        if (Array.isArray(validationResult) && !validationResult[0]) {
          this._errors[key] = validationResult[1] || ERROR_TYPE.VALUE_NOT_VALID;
          return;
        }

        // For regex validation result
        if (!validationResult) {
          this._errors[key] = ERROR_TYPE.VALUE_NOT_VALID;
          return;
        }
      }
    }

    // Set value(error) to undefined after passing all validations.
    this._errors[key] = undefined;
  }

  private getUniqueId() {
    return Math.random().toString(36).substr(2, 9);
  }
}
