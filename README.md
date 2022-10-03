<h1>countdown-gif ⏳</h1>

> This is a simple countdown gif generator. It takes an end date and generates a gif that counts down from now to the end date.

## Install

```sh
yarn
```

## Dev

```sh
yarn dev
```

## Prod

```sh
yarn start
```

## Usage

**URL: http://localhost:3000/countdown?time=2022-10-11**

**PARAMS**:

- **time** - **REQUIRED** Date &amp; time when your countdown will end [e.g. 2022-10-11T20:35]
- **frames** - number of frames (also number of seconds) the countdown will run before looping [defaults to 30]
- **width** - width in pixels [defaults to 500]
- **height** - height in pixels [defaults to 150]
- **bg** - hex color code (without "#") for the background [defaults to F8F4EF]
- **color** - hex color code (without "#") for the text [defaults to 2B2B2C]
- **name** - filename used for the generated gif [defaults to "countdown"]

## Author

👤 **Alex Bulat**

- Website: https://minora.me
- Github: [@bulatte](https://github.com/bulatte)
