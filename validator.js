function Validator(formSelector) {
	var formRules = {};
	var _this = this;

	function getParent(element, selector) {
		while (element.parentElement) {
			if (element.parentElement.matches(selector)) {
				return element.parentElement;
			}

			element = element.parentElement;
		}
	}

	/**
	 * Quy ước tạo Rule:
	 * - Nếu có lỗi thì return 'message error'
	 * - Nêu không có lỗi thì return undefined
	 */
	var validatorRules = {
		required: function (value) {
			return value.trim() ? undefined : 'Vui lòng nhập trường này';
		},
		email: function (value) {
			var regex = (regex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);
			return regex.test(value) ? undefined : 'Email không hợp lệ';
		},
		min: function (min) {
			return function (value) {
				return value.length >= min
					? undefined
					: `Vui lòng nhập tối thiểu ${min} kí tự`;
			};
		},
		max: function (max) {
			return function (value) {
				return value.length <= min
					? undefined
					: `Vui lòng nhập tối thiểu ${max} kí tự`;
			};
		},
	};

	// Lấy ra form element trong DOM theo 'formSelector'
	var formElement = document.querySelector(formSelector);

	// Chỉ xử lý khi có element trong DOM
	if (formElement) {
		var inputs = formElement.querySelectorAll('[name][rules]');

		for (var input of inputs) {
			rules = input.getAttribute('rules').split('|');

			for (var rule of rules) {
				var ruleInfo;
				var isRuleHasValue = rule.includes(':');

				if (isRuleHasValue) {
					var ruleInfo = rule.split(':');
					rule = ruleInfo[0];
				}

				var ruleFunc = validatorRules[rule];

				if (isRuleHasValue) {
					ruleFunc = ruleFunc(ruleInfo[1]);
				}

				if (Array.isArray(formRules[input.name])) {
					formRules[input.name].push(ruleFunc);
				} else {
					formRules[input.name] = [ruleFunc];
				}
			}

			// Lắng nghe sự kiện để validate (blur, change, ...)

			input.onblur = handleValidate;
			input.oninput = handleChange;
		}

		// Hàm kiểm tra điều kiện dựa trên rules của mỗi thẻ input
		function handleValidate(e) {
			var rules = formRules[e.target.name];
			var errorMessage;

			// Vòng lặp để kiểm tra lỗi ở bất kì input nào
			for (var rule of rules) {
				errorMessage = rule(e.target.value);
				if (errorMessage) break;
			}

			// Kiểm tra điều kiện để tìm parentElement để thêm class invalid cũng như add error message
			if (errorMessage) {
				var formGroup = getParent(e.target, '.form-group');

				if (formGroup) {
					formGroup.classList.add('invalid');
					var errorElement = formGroup.querySelector('.form-message');
					if (errorElement) {
						errorElement.innerText = errorMessage;
					}
				} else {
					formGroup.classList.remove('invalid');
					errorElement.innerText = '';
				}
			}

			// Trả về boolean để làm điều kiện lúc submit
			return !errorMessage;
		}

		// Hàm kiểm tra thay đổi giá trị khi nhập của input để xóa class invalid
		function handleChange(e) {
			var formGroup = getParent(e.target, '.form-group');
			var errorElement = formGroup.querySelector('.form-message');

			if (e.target.value) {
				if (formGroup.classList.contains('invalid')) {
					errorElement.innerText = '';
					formGroup.classList.remove('invalid');
				}
			}
		}
	}

	// Hàm submit
	formElement.onsubmit = function (e) {
		e.preventDefault();

		var inputs = formElement.querySelectorAll('[name][rules]');
		var isValid = true;

		// Vòng lặp để kiểm tra từng input có thỏa điều kiện theo rule
		for (var input of inputs) {
			if (
				!handleValidate({
					target: input,
				})
			) {
				isValid = false;
			}
		}

		// Kiểm tra điều kiện trước khi submit
		if (isValid) {
			if (typeof _this.onSubmit === 'function') {
				var enableInputs = formElement.querySelectorAll(
					'[name]:not([disabled])'
				);

				// Form để lấy dữ liệu từ các input
				var formValues = Array.from(enableInputs).reduce((value, input) => {
					switch (input.type) {
						case 'radio':
							value[input.name] = formElement.querySelector(
								'input[name="' + input.name + '"]:checked'
							).value;
							break;
						case 'checkbox':
							if (!input.matches(':checked')) {
								value[input.name] = [];
								return values;
							}
							if (!Array.isArray(value[input.name])) {
								value[input.name] = [];
							}
							value[input.name].push(input.value);
							break;
						case 'file':
							values[input.name] = input.files;
							break;
						default:
							value[input.name] = input.value;
					}

					return value;
				}, {});

				_this.onSubmit(formValues);
			} else {
				formElement.submit();
			}
		}
	};
}
