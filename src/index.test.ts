import { observable, makeObservable } from 'mobx';

import Form, { FieldSource, ERROR_TYPE } from './index';

describe('mobx-light-form', () => {
  describe('form initialization', () => {
    class FooForm extends Form {
      public foo: FieldSource<string>;

      constructor() {
        super();

        this.foo = this.generateField({
          key: 'foo',
          value: 'test'
        });

        makeObservable(this, {
          foo: observable
        });
      }
    }

    class ErrorForm extends Form {
      public foo: FieldSource<string>;

      constructor() {
        super();

        // @ts-ignore
        this.foo = this.generateField({
          value: 'test'
        });

        makeObservable(this, {
          foo: observable
        });
      }
    }

    it('form should be initialized without error', () => {
      const fooForm = new FooForm();

      expect(fooForm.foo.value).toBe('test');
    });

    it('throws an error when key of the field is not declared', () => {
      expect(() => {
        const errorForm = new ErrorForm();
      }).toThrow(Error);
    });
  });

  describe('form properties', () => {
    type BarType = 'a' | 'b' | 'c';

    class FooForm extends Form {
      public foo: FieldSource<string>;

      public bar: FieldSource<BarType>;

      constructor() {
        super();

        this.foo = this.generateField<string>({
          key: 'foo',
          value: '',
          isRequired: true,
          validation: [
            (v: string) => [v.length < 5, 'maxLength error']
          ]
        });

        this.bar = this.generateField<BarType>({
          key: 'bar',
          isRequired: true,
          requiredMessage: 'Required'
        }, true);

        makeObservable(this, {
          foo: observable,
          bar: observable
        });
      }
    }

    class ForRegexValidationForm extends Form {
      public name: FieldSource<string>;

      constructor() {
        super();

        this.name = this.generateField<string>({
          key: 'name',
          value: '',
          validation: [
            /^Pewww.*$/
          ]
        });

        makeObservable(this, {
          name: observable
        });
      }
    }

    class ForSyncValidationForm extends Form {
      public name: FieldSource<string>;

      constructor() {
        super();

        this.name = this.generateField<string>({
          key: 'name',
          value: '',
          validation: [
            (v: string) => [
              v.includes('a') && v.length > 10,
              'not valid'
            ]
          ]
        });

        makeObservable(this, {
          name: observable
        });
      }
    }

    class ForAsyncValidationForm extends Form {
      public name: FieldSource<string>;

      constructor() {
        super();

        const TestAPI = {
          checkIsAvailable: (value: string): Promise<boolean> => {
            const existingNames = [
              'AAA',
              'BBB',
              'CCC',
              'DDD',
              'EEE'
            ];
    
            return new Promise(resolve => {
              setTimeout(() => {
                resolve(!existingNames.includes(value));
              }, 200);
            });
          }
        };

        this.name = this.generateField<string>({
          key: 'name',
          value: '',
          validation: [
            async (v: string) => {
              const isAvailableName = await TestAPI.checkIsAvailable(v);

              return [isAvailableName, 'already exists'];
            },
            (v: string) => [
              v.length > 5,
              'required length'
            ]
          ]
        });

        makeObservable(this, {
          name: observable
        });
      }
    }

    // generateField()
    it('generateField() - set error if value is falsy when required option is true', () => {
      const fooForm = new FooForm();

      expect(fooForm.errors.foo).not.toBe(undefined);
    });

    it("generateField() - ignore error if value is falsy when required option is true and 'withoutInitialValidation' option is also given", () => {
      const fooForm = new FooForm();

      expect(fooForm.errors.bar).toBe(undefined);
    });

    // update()
    it("update() - update field and make it 'touched'", () => {
      const fooForm = new FooForm();

      fooForm.update({
        foo: 'abcd',
        bar: 'c'
      });

      expect(fooForm.foo.value).toBe('abcd');
      expect(fooForm.touched.foo).toBe(true);

      expect(fooForm.bar.value).toBe('c');
      expect(fooForm.touched.bar).toBe(true);
    });

    // reset()
    it("reset() - reset all fields and reset 'touched', 'errors' status", () => {
      const fooForm = new FooForm();

      fooForm.update({
        foo: 'abcde'
      });

      expect(fooForm.foo.value).toBe('abcde');
      expect(fooForm.errors.foo).not.toBe(undefined);
      expect(fooForm.touched.foo).toBe(true);

      fooForm.reset();

      expect(fooForm.foo.value).toBe('');
      expect(fooForm.errors.foo).toBe(undefined);
      expect(fooForm.touched.foo).toBe(false);
    });

    // clear()
    it("clear() - reset all fields and reset 'touched' status, validate after resetting", () => {
      const fooForm = new FooForm();

      fooForm.update({
        foo: 'abcde'
      });

      expect(fooForm.foo.value).toBe('abcde');
      expect(fooForm.errors.foo).not.toBe(undefined);
      expect(fooForm.touched.foo).toBe(true);

      fooForm.clear();

      expect(fooForm.foo.value).toBe('');
      expect(fooForm.errors.foo).not.toBe(undefined);
      expect(fooForm.touched.foo).toBe(false);
    });

    // validate()
    it("validate() - 'isValid' should be false if value is falsy when 'isRequired' option is true", async () => {
      const fooForm = new FooForm();

      await fooForm.validate();

      expect(fooForm.isValid).toBe(false);
    });

    it("validate() - errorMessage should be 'requiredMessage' if value is falsy and 'requiredMessage' option is given", async () => {
      const fooForm = new FooForm();

      await fooForm.validate();

      expect(fooForm.errors.foo).toBe(ERROR_TYPE.VALUE_NOT_REQUIRED);
      expect(fooForm.errors.bar).toBe('Required');
    });

    it('validate() - check for regex validation', async () => {
      const form = new ForRegexValidationForm();

      await form.validate();

      expect(form.isValid).toBe(false);

      form.update({
        name: 'Pewww'
      });

      await form.validate();

      expect(form.isValid).toBe(true);
    });

    it('validate() - check for synchronous function validation', async () => {
      const form = new ForSyncValidationForm();

      form.update({
        name: 'aaaaa'
      });

      await form.validate();

      expect(form.isValid).toBe(false);

      form.update({
        name: 'abcdefg12345'
      });

      await form.validate();

      expect(form.isValid).toBe(true);
    });

    it('validate() - check for asynchronous function validation', async () => {
      const form = new ForAsyncValidationForm();

      form.update({
        name: 'AAA'
      });

      await form.validate();

      expect(form.isValid).toBe(false);
      expect(form.errors.name).toBe('already exists');

      form.update({
        name: 'AAAB'
      });

      await form.validate();

      expect(form.isValid).toBe(false);
      expect(form.errors.name).toBe('required length');

      form.update({
        name: 'AAABCDE'
      });

      await form.validate();

      expect(form.isValid).toBe(true);
    });
  });
});
