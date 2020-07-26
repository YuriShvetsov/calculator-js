const app = document.getElementById('app');

app.addEventListener('click', handlerClick);

function handlerClick(event) {
    let prop = event.target.dataset.prop;

    if (prop === undefined) return;

    model.do(prop);

    let result = model.getResult();

    view.renderResult(result);
    view.changeResultSize(result);

    let expression = model.getExpression();

    view.renderExpression(expression);
}

const model = {
    state: {
        cur: null,
        prev: null,
        result: null,
        operation: null
    },
    props: {
        maxLength: 16,
        maxAccuracy: 7,
        minNumber: 1e-8,
        mathOperations: {
            'add': '+',
            'subtract': '-',
            'multiply': '*',
            'divide': '/',
        },
        mainOperations: ['clear', 'sign', 'solve', 'percent']
    },

    /* Math operations */

    add: function() {
        let result = this.getDecimalNumber(+this.state.prev + +this.state.cur);
        return result;
    },
    subtract: function() {
        let result = this.getDecimalNumber(+this.state.prev - +this.state.cur);
        return result;
    },
    multiply: function() {
        let result = this.getDecimalNumber(+this.state.prev * +this.state.cur);
        return result;
    },
    divide: function() {
        let result = this.getDecimalNumber(+this.state.prev / +this.state.cur);
        return result;
    },
    percent: function() {
        let percentPart = this.state.cur = this.getDecimalNumber(this.state.cur / 100).toString();

        this.state.cur = percentPart;

        if (this.state.operation) {
            this.solve();
        }
    },

    /* Main operations */

    // clear all data (очистить все данные)
    clear: function() {
        Object.keys(this.state).forEach(key => this.state[key] = null);
    },
    // set or unset sign of minus for current value (установить или убрать знак минуса для текущего значения)
    sign: function() {
        if (this.state.cur === null) this.state.cur = '0';

        if (this.state.operation && this.state.result) {
            this.state.cur = this.state.result;
            this.state.prev = null;
            this.state.result = null;
            this.state.operation = null;
        }

        if (!this.state.cur.includes('-')) {
            this.state.cur = '-' + this.state.cur;
        } else {
            this.state.cur = this.state.cur.slice(1);
        }
    },
    // solve current exxpression (решить текущее выражение)
    solve: function() {
        if (!this.state.operation) return;

        if (!this.state.cur) {
            this.state.cur = this.state.prev;
        }

        if (this.state.result) {
            this.state.prev = this.state.result;
        }

        let solving = this.state.operation.func();

        this.state.result = solving.toString();
    },

    /* Main methods */

    // entry point (входная точка)
    do: function(something) {
        if (this.isInteger(+something) || this.isDot(something)) {
            this.setCurValue(something);
        } else if (this.contains(Object.keys(this.props.mathOperations), something)) {
            this.setOperation(something);
        } else if (this.contains(this.props.mainOperations, something)) {
            this[something]();
        } else {
            console.error('Error! This operation is not found.');
        }

        // console.log(Object.values(this.state));
    },
    // setting current value (задание текущего значения)
    setCurValue: function(value) {
        if (this.state.result) this.clear();

        if (this.state.cur === null) this.state.cur = '0';

        if (this.state.cur.length >= this.props.maxLength) return;

        if (this.state.cur === '0' && value != '.') {
            this.state.cur = '';
        } else if (this.state.cur == '-0' && value != '.') {
            this.state.cur = '-';
        } else if (this.state.cur.includes('.') && value == '.') {
            return;
        }

        this.state.cur = this.state.cur + value;
    },
    // setting operation or replacing for a new (установка операции или замена на новую)
    setOperation: function(name) {
        if (this.state.operation && this.state.result) {
            this.state.cur = null;
            this.state.prev = this.state.result;
            this.state.result = null;
        } else if (!this.state.operation && !this.state.result) {
            this.state.prev = this.state.cur;
            this.state.cur = null;
        }

        this.state.operation = {
            func: this[name].bind(this),
            name: this.props.mathOperations[name]
        };
    },
    // getting result for output (получение результата для вывода)
    getResult: function() {
        if (this.state.result !== null) {
            if (isNaN(this.state.result)) {
                this.clear();
                return 'Error';
            } else if (Math.abs(+this.state.result) < this.props.minNumber) {
                this.clear();
                return '0';
            }

            return this.state.result;
        } else if (!this.state.cur && !this.state.prev) {
            return '0';
        } else if (!this.state.cur && this.state.prev) {
            return this.state.prev;
        } else if (this.state.cur && !this.state.prev) {
            return this.state.cur;
        } else if (this.state.cur && this.state.prev) {
            return this.state.cur;
        }
    },
    // getting a calculated expression (получение выполненного выражения)
    getExpression: function() {
        let expr = '';

        if (this.state.prev) {
            expr += this.state.prev;
        }

        if (this.state.operation) {
            expr += ' ' + this.state.operation.name;
        }

        if (this.state.cur) {
            expr += ' ' + this.state.cur;
        }

        return expr;
    },
    // getting decimal number (получение числа в корректном виде, с фиксированной длиной)
    getDecimalNumber: function(num) {
        let integerPartNumber = this.getIntegerNumber(num).toString();
        let accuracy = this.props.maxLength - integerPartNumber.length;

        if (accuracy > this.props.maxAccuracy) accuracy = this.props.maxAccuracy;

        if (accuracy < 0 && num > 0) {
            return Infinity;
        } else if (accuracy < 0 && num < 0) {
            return -Infinity;
        }

        return parseFloat(+num.toFixed(accuracy));
    },
    // checking that the number is integer number (проверка, что число является целым числом)
    isInteger: function(symbol) {
        return (symbol ^ 0) === symbol;
    },
    // checking that the symbol is dot (проверка, что символ является точкой)
    isDot: function(symbol) {
        return symbol === '.';
    },
    // transforming the number to integer (преобразования числа к целому)
    getIntegerNumber: function(num) {
        return Math.floor(num);
    },
    // checking of element in array (проверка элемента в массиве)
    contains: function(arr, elem) {
        return arr.indexOf(elem) != -1;
    }
};

const view = {
    display: app.querySelector('.js-display'),
    result: app.querySelector('.js-result'),
    expression: app.querySelector('.js-expression'),
    renderResult: function(value) {
        this.result.innerHTML = value;
    },
    renderExpression: function(value) {
        this.expression.innerHTML = value;
    },
    changeResultSize: function(str) {
        if (str.length > 15) {
            this.result.style.fontSize = '24px';
        } else if (str.length > 14) {
            this.result.style.fontSize = '26px';
        } else if (str.length > 13) {
            this.result.style.fontSize = '28px';
        } else if (str.length > 12) {
            this.result.style.fontSize = '30px';
        } else if (str.length > 11) {
            this.result.style.fontSize = '32px';
        } else if (str.length > 10) {
            this.result.style.fontSize = '36px';
        } else {
            this.result.style.fontSize = '42px';
        }
    }
};
