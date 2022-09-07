# MobX Light Form

### ✨ MobX Form State Management with automatic validation

Seperate subjects which manage form data to prevent duplication of data and ensure consistency.<br>
The basic principle of responsibility allocation is to allocate responsibility to objects with information that can perform responsibility, so that the form can take charge of the transformation of data to be sent from the client to the server.

## [Demo](https://codesandbox.io/s/mobx-light-form-demo-wmnbd?file=/src/views/PersonBody.tsx)

<div align="center">
  <img src="https://user-images.githubusercontent.com/23455736/153737842-44843682-c1df-4d50-b3ec-54704598a01f.png" alt="예시 이미지" width="680">
</div>

## 🔍️ Features

- Form update, reset and clear
- Check form is valid or has some errors
- To be added

## ⚙ Install

### npm

```
npm install mobx-light-form
```

### yarn

```
yarn add mobx-light-form
```

## 🚀 Quick Start

### 1-a. Define Form

```typescript
import { makeObservable, observable } from 'mobx';

import Form, { FieldSource } from 'mobx-light-form';

export default class PersonForm extends Form {
  public name: FieldSource<string>;

  public nickname: FieldSource<string>;

  constructor() {
    super();

    this.name = this.generateField<string>({
      key: 'name', // Required: Should be same as member field
      label: 'Name',
      isRequired: true, // Should not be empty
      value: '', // Default value,
      validation: [
        /^Pewww.*$/, // Can be Regex or
        (v: string) => [ // function - () => [boolean, ErrorMessage | undefined]
          v === 'Pewwwww',
          "Should be 'Pewwwww'"
        ]
      ]
    });

    const TestAPI = {
      checkIsAvailable: (value: string) => {
        const existingNicknames = [
          'AAA',
          'BBB',
          'CCC',
          'DDD',
          'EEE'
        ];

        return new Promise(resolve => {
          setTimeout(() => {
            resolve(!existingNicknames.includes(value));
          }, 200);
        });
      }
    };

    this.nickname = this.generateField<string>(
      {
        key: 'nickname',
        label: 'Nickname',
        value: '',
        validation: [
          // If you want to use asynchronous validation
          async (v: string) => {
            const isAvailableNickname = await TestAPI.checkIsAvailable(v);

            return [isAvailableNickname, 'Your nickname already exists.'];
          }
        ]
      },
      true // Prevent initial validation
    );

    makeObservable(this, {
      name: observable,
      nickname: observable
    });
  }

  public toDto() { // Convert data to be sent to the server here.
    return {
      personName: this.name.value,
      nickname: this.nickname.value
    };
  }
}
```

### 1-b. Define Form with array value

> Define another form to be an item of array.

```typescript
import { makeObservable, observable } from 'mobx';

import Form, { FieldSource } from 'mobx-light-form';

export default class BookForm extends Form {
  public name: FieldSource<string>;

  public author: FieldSource<string>;

  constructor() {
    super();

    this.name = this.generateField<string>({
      key: 'name',
      label: 'Book Name',
      value: '',
      isRequired: true
    });

    this.author = this.generateField<string>({
      key: 'author',
      label: 'Author',
      value: ''
    });

    makeObservable(this, {
      name: observable,
      author: observable
    });
  }
}
```

```typescript
import { makeObservable, observable, action } from 'mobx';

import Form, { FieldSource } from 'mobx-light-form';

import BookForm from 'src';

export default class PersonForm extends Form {
  // ...other fields
  public favoriteBooks: BookForm[];

  constructor() {
    super();

    this.favoriteBooks = [];

    makeObservable(this, {
      favoriteBooks: observable,
      addBook: action,
      clearBooks: action
    });
  }

  public addBook() { // If you need, override or create form methods.
    this.favoriteBooks.push(new BookForm());
  }

  public clearBooks() {
    this.favoriteBooks = [];
  }
}
```

### 2. Register form in store

```typescript
import PersonForm from 'src';

export default class PersonStore {
  public personForm: PersonForm;

  constructor() {
    this.personForm = new PersonForm();
  }
}
```

### 3. Handle Input values

```tsx
// Please see Demo

import React, { useCallback } from 'react';
import { observer } from 'mobx-react';
import debounce from 'lodash.debounce';

import { usePersonStores } from '../stores/PersonProvider';

import { Input, Button } from '../components';

const PersonBody = observer(() => {
  const { personStore } = usePersonStores(); // The way you get mobx store
  const { personForm: form } = personStore;

  const handleChange = useCallback(
    (fieldName: string) => (value: string) => {
      form.update({
        [fieldName]: value
      });
    },
    [form]
  );

  const debouncedValidate = useCallback(debounce(() => {
    form.validate(); // Trigger validation when you need
  }, 500), [form]);

  const handleNicknameChange = useCallback((value: string) => {
    form.update(
      {
        nickname: value
      },
      true // Prevent validation
    );

    debouncedValidate();
  }, [form, debouncedValidate]);

  const handleReset = useCallback(() => {
    form.reset();
  }, [form]);

  const handleBookAdd = useCallback(() => {
    form.addBook();
  }, [form]);

  const handleBooksClear = useCallback(() => {
    form.clearBooks();
  }, [form]);

  const handleSubmit = useCallback(() => {
    console.log('Submit Result: ', form.toDto());
  }, [form]);

  return (
    <Wrapper>
      <Input
        label={form.name.label}
        value={form.name.value}
        placeholder="Write name"
        onChange={handleChange("name")}
      />
      {!!form.errors.name && (
        <ErrorMessage>{form.errors.name}</ErrorMessage>
      )}
      <Input
        label={form.nickname.label}
        value={form.nickname.value}
        placeholder="Write nickname"
        onChange={handleNicknameChange}
      />
      {!!form.errors.nickname && (
        <ErrorMessage>{form.errors.nickname}</ErrorMessage>
      )}
      {form.favoriteBooks.map((f) => (
        <FavoriteBookWrapper key={f.__id}>
          <Input
            placeholder="Write author"
            label={f.author.label}
            value={f.author.value}
            onChange={(value) => {
              f.update({
                author: value
              });
            }}
          />
          <Input
            placeholder="Write book name"
            label={f.name.label}
            value={f.name.value}
            className="book-name"
            onChange={(value) => {
              f.update({
                name: value
              });
            }}
          />
        </FavoriteBookWrapper>
      ))}
      <StyledButton onClick={handleReset}>Reset</StyledButton>
      <StyledButton onClick={handleBookAdd}>Add Book</StyledButton>
      <StyledButton onClick={handleBooksClear}>Clear Books</StyledButton>
      <StyledButton onClick={handleSubmit} disabled={!form.isValid}>
        Submit
      </StyledButton>
    </Wrapper>
  );
});

export default PersonBody;
```

## FAQ

### 1. What is the difference between `reset` and `clear`?

If you 'reset', it initializes all fields and then initializes both 'touched' and 'errors' properties.<br>
The value of 'isValid' may not be set properly because 'errors' property is initialized(`undefined`).<br>
It is recommended to run the 'validate' method at a certain point in time to check the validation.

On the other hand, If you 'clear', it initialized all fields and then initialized 'touched' property, but it does not initialize 'errors' property.<br>
Since validation is checked internally after all fields are initialized, it is recommended to use it when it is necessary to check 'isValid' from the beginning.
