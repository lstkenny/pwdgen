var passwordInput = document.querySelectorAll('[type="password"]');
if (typeof passwordInput !== 'undefined')
{
	passwordInput.forEach(function(input) {
		input.value = _pwd_data.password;
	});
}