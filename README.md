# Mobx Light Form

### ✨ Mobx Form State Management with automatic validation

Seperate subjects which manage form data to prevent duplication of data and ensure consistency.<br>
The basic principle of responsibility allocation is to allocate responsibility to objects with information that can perform responsibility, so that the form can take charge of the transformation of data to be sent from the client to the server.

### [Demo](Demo)

<div align="center">
  <img src="https://user-images.githubusercontent.com/23455736/153736858-09b1cd3b-67db-4056-a73d-3b7d8c296b69.png" alt="예시 이미지" width="600">
</div>

### 🔍️ Features

- Form update and reset
- Check form is valid or has some errors
- To be added

### ⚙ Install

#### npm

```
npm install mobx-light-form
```

#### yarn

```
yarn add mobx-light-form
```

### 🚀 Quick Start

#### 1-a. Define Form

```typescript
import { makeObservable, observable } from 'mobx';

import Form, { FieldSource } from 'mobx-light-form';

export default class PersonForm extends Form {
  public name: FieldSource<string>;

  constructor() {
    super();

    this.name = this.generateField<string>({
      key: 'name', // Required: Should be same as member field
      label: 'Name',
      isRequired: true, // Should not be empty
      value: '' // Default value,
      validation: [
        /^Pewww.*$/, // Can be Regex or
        (v: string) => [ // Custom function - () => [boolean, ErrorMessage | undefined]
          v === 'Pewwwww',
          "Should be 'Pewwwww'"
        ]
      ]
    });

    makeObservable(this, {
      name: observable
    });
  }

  public toPersonDto() { // Convert data to be sent to the server here.
    return {
      personName: this.name.value
    };
  }
}
```

#### 1-b. Define Form with array value

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
      label: '책 이름',
      value: '',
      isRequired: true
    });

    this.author = this.generateField<string>({
      key: 'author',
      label: '저자',
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
import { makeObservable, observable } from 'mobx';

import Form, { FieldSource } from 'mobx-light-form';

export default class PersonForm extends Form {
  // ...other fields
  public favoriteBooks: BookForm[];

  constructor() {
    super();

    this.favoriteBooks = [new BookForm()];

    makeObservable(this, {
      favoriteBooks: observable
    });
  }

  public clearBooks() { // If you need, override or create form methods.
    this.favoriteBooks = [];
  }
}
```

#### 2. Register form in store

```typescript
import PersonForm from 'src';

export default class PersonStore {
  public personForm: PersonForm;

  constructor() {
    this.personForm = new PersonForm();
  }
}
```

#### 3. Handle Input values

```tsx
// Please see Demo

import React, { useCallback } from 'react';
import PersonForm from 'src';

const PersonBody = () => {
  const { personStore } = getStore(); // The way you get mobx store
  const { personForm } = personStore;

  const handleChange = useCallback((fieldName: string) => (value: string) => {
    personForm.update({
      [fieldName]: value
    });
  }, [personForm]);

  const handleReset = useCallback(() => {
    personForm.reset();
  }, [personForm]);

  const handleBookAdd = useCallback(() => {
    personForm.favoriteBooks.push(
      new PersonForm()
    );
  }, [personForm]);

  const handleBooksClear = useCallback(() => {
    personForm.clearBooks();
  }, [personForm]);

  return (
    <Wrapper>
      <Input
        value={personForm.name.value}
        label={personForm.name.label}
        onChange={handleChange('name')}
      />
      {personForm.favoriteBooks.map((form, index) => (
        <React.Fragment key={form.__id}>
          <Input
            value={form.name.value}
            label={form.name.label}
            onChange={e => {
              form.update({
                name: e.target.value
              });
            }}
          />
          <Input
            value={form.author.value}
            label={form.author.label}
            disabled
          />
        </React.Fragment>
      ))}
      <Button onClick={handleReset}>Reset</Button>
      <Button onClick={handleBooksClear}>Clear Books</Button>
    </Wrapper>
  );
};

export default PersonBody;
```
