"""
Secure expression evaluator for quantity rules.

Parses mathematical expressions safely without using eval() or AST execution.
Supports basic arithmetic, functions, and conditional logic.
"""

import re
from decimal import Decimal, ROUND_HALF_UP
from typing import Dict, List, Union
from enum import Enum


class TokenType(Enum):
    """Token types for the expression parser."""
    NUMBER = "NUMBER"
    VARIABLE = "VARIABLE"
    OPERATOR = "OPERATOR"
    FUNCTION = "FUNCTION"
    LEFT_PAREN = "LEFT_PAREN"
    RIGHT_PAREN = "RIGHT_PAREN"
    COMMA = "COMMA"


class Token:
    """Represents a token in the expression."""

    def __init__(self, type: TokenType, value: str, position: int):
        self.type = type
        self.value = value
        self.position = position

    def __repr__(self):
        return f"Token({self.type.value}, '{self.value}', pos={self.position})"


class RulesEvaluator:
    """
    Secure expression evaluator for quantity rules.

    Parses mathematical expressions and evaluates them safely using RPN (Reverse Polish Notation).
    Supports arithmetic operations, functions, and conditional logic.
    """

    # Allowed operators and their precedence
    OPERATORS = {
        '+': (1, lambda a, b: a + b),
        '-': (1, lambda a, b: a - b),
        '*': (2, lambda a, b: a * b),
        '/': (2, lambda a, b: a / b if b != 0 else Decimal('0')),
    }

    # Allowed functions
    FUNCTIONS = {
        'ceil': lambda x: x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP).__ceil__(),
        'floor': lambda x: x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP).__floor__(),
        'round': lambda x, nd=0: x.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP),
        'min': lambda a, b: min(a, b),
        'max': lambda a, b: max(a, b),
        'case': lambda cond, a, b: a if cond else b,
    }

    def __init__(self, variables: Dict[str, Union[Decimal, int, float, bool]]):
        """
        Initialize the evaluator with variables.

        Args:
            variables: Dictionary of variable names and their values
        """
        self.variables = {}
        for k, v in variables.items():
            converted_value = self._convert_to_decimal(v)
            if isinstance(converted_value, (Decimal, str)):
                self.variables[k] = converted_value

    def _convert_to_decimal(self, value: Union[Decimal, int, float, bool, str]) -> Union[Decimal, str]:
        """Convert a value to Decimal or keep as string."""
        if isinstance(value, bool):
            return Decimal('1') if value else Decimal('0')
        elif isinstance(value, (int, float)):
            return Decimal(str(value))
        elif isinstance(value, Decimal):
            return value
        elif isinstance(value, str):
            return value  # Keep strings as-is for room_type, finish_level
        else:
            raise ValueError(f"Unsupported value type: {type(value)}")

    def tokenize(self, expression: str) -> List[Token]:
        """
        Tokenize the expression string.

        Args:
            expression: Mathematical expression as string

        Returns:
            List of tokens

        Raises:
            ValueError: If expression contains invalid characters
        """
        # Remove whitespace
        expression = expression.replace(' ', '')

        # Validate characters
        if not re.match(r'^[a-zA-Z0-9_+\-*/()\.,]+$', expression):
            raise ValueError("Expression contains invalid characters")

        tokens = []
        i = 0

        while i < len(expression):
            char = expression[i]

            if char.isdigit() or char == '.':
                # Parse number
                start = i
                while i < len(expression) and (expression[i].isdigit() or expression[i] == '.'):
                    i += 1
                number_str = expression[start:i]
                try:
                    Decimal(number_str)  # Validate number format
                    tokens.append(Token(TokenType.NUMBER, number_str, start))
                except Exception:
                    raise ValueError(f"Invalid number format: {number_str}")
                continue

            elif char.isalpha() or char == '_':
                # Parse variable or function
                start = i
                while i < len(expression) and (expression[i].isalnum() or expression[i] == '_'):
                    i += 1
                identifier = expression[start:i]

                # Check if it's a function (followed by '(')
                if i < len(expression) and expression[i] == '(':
                    if identifier not in self.FUNCTIONS:
                        raise ValueError(f"Unknown function: {identifier}")
                    tokens.append(Token(TokenType.FUNCTION, identifier, start))
                else:
                    tokens.append(Token(TokenType.VARIABLE, identifier, start))
                continue

            elif char in '+-*/':
                tokens.append(Token(TokenType.OPERATOR, char, i))

            elif char == '(':
                tokens.append(Token(TokenType.LEFT_PAREN, char, i))

            elif char == ')':
                tokens.append(Token(TokenType.RIGHT_PAREN, char, i))

            elif char == ',':
                tokens.append(Token(TokenType.COMMA, char, i))

            else:
                raise ValueError(f"Unexpected character: {char}")

            i += 1

        return tokens

    def _shunting_yard(self, tokens: List[Token]) -> List[Token]:
        """
        Convert infix expression to RPN using Shunting Yard algorithm.

        Args:
            tokens: List of tokens in infix order

        Returns:
            List of tokens in RPN order
        """
        output = []
        operator_stack = []

        for token in tokens:
            if token.type == TokenType.NUMBER:
                output.append(token)

            elif token.type == TokenType.VARIABLE:
                output.append(token)

            elif token.type == TokenType.FUNCTION:
                operator_stack.append(token)

            elif token.type == TokenType.OPERATOR:
                while (operator_stack and
                       operator_stack[-1].type == TokenType.OPERATOR and
                       self.OPERATORS[operator_stack[-1].value][0] >= self.OPERATORS[token.value][0]):
                    output.append(operator_stack.pop())
                operator_stack.append(token)

            elif token.type == TokenType.LEFT_PAREN:
                operator_stack.append(token)

            elif token.type == TokenType.RIGHT_PAREN:
                while operator_stack and operator_stack[-1].type != TokenType.LEFT_PAREN:
                    output.append(operator_stack.pop())
                if operator_stack and operator_stack[-1].type == TokenType.LEFT_PAREN:
                    operator_stack.pop()  # Remove left parenthesis
                else:
                    raise ValueError("Mismatched parentheses")

                # If top of stack is function, pop it
                if operator_stack and operator_stack[-1].type == TokenType.FUNCTION:
                    output.append(operator_stack.pop())

            elif token.type == TokenType.COMMA:
                # Handle function arguments
                while (operator_stack and
                       operator_stack[-1].type != TokenType.LEFT_PAREN):
                    output.append(operator_stack.pop())

        # Pop remaining operators
        while operator_stack:
            if operator_stack[-1].type == TokenType.LEFT_PAREN:
                raise ValueError("Mismatched parentheses")
            output.append(operator_stack.pop())

        return output

    def _evaluate_rpn(self, rpn_tokens: List[Token]) -> Decimal:
        """
        Evaluate RPN expression.

        Args:
            rpn_tokens: List of tokens in RPN order

        Returns:
            Result as Decimal with 2 decimal places precision
        """
        stack = []

        for token in rpn_tokens:
            if token.type == TokenType.NUMBER:
                stack.append(Decimal(token.value))

            elif token.type == TokenType.VARIABLE:
                if token.value not in self.variables:
                    raise ValueError(f"Undefined variable: {token.value}")
                value = self.variables[token.value]
                if isinstance(value, str):
                    raise ValueError(f"Variable {token.value} is a string and cannot be used in calculations")
                stack.append(value)

            elif token.type == TokenType.OPERATOR:
                if len(stack) < 2:
                    raise ValueError("Insufficient operands for operator")
                b = stack.pop()
                a = stack.pop()
                result = self.OPERATORS[token.value][1](a, b)
                stack.append(result)

            elif token.type == TokenType.FUNCTION:
                if token.value == 'ceil':
                    if len(stack) < 1:
                        raise ValueError("Insufficient operands for ceil function")
                    x = stack.pop()
                    result = self.FUNCTIONS['ceil'](x)
                    stack.append(Decimal(str(result)))

                elif token.value == 'floor':
                    if len(stack) < 1:
                        raise ValueError("Insufficient operands for floor function")
                    x = stack.pop()
                    result = self.FUNCTIONS['floor'](x)
                    stack.append(Decimal(str(result)))

                elif token.value == 'round':
                    if len(stack) < 1:
                        raise ValueError("Insufficient operands for round function")
                    x = stack.pop()
                    result = self.FUNCTIONS['round'](x)
                    stack.append(result)

                elif token.value == 'min':
                    if len(stack) < 2:
                        raise ValueError("Insufficient operands for min function")
                    b = stack.pop()
                    a = stack.pop()
                    result = self.FUNCTIONS['min'](a, b)
                    stack.append(result)

                elif token.value == 'max':
                    if len(stack) < 2:
                        raise ValueError("Insufficient operands for max function")
                    b = stack.pop()
                    a = stack.pop()
                    result = self.FUNCTIONS['max'](a, b)
                    stack.append(result)

                elif token.value == 'case':
                    if len(stack) < 3:
                        raise ValueError("Insufficient operands for case function")
                    b = stack.pop()
                    a = stack.pop()
                    cond = stack.pop()
                    result = self.FUNCTIONS['case'](cond, a, b)
                    stack.append(result)

        if len(stack) != 1:
            raise ValueError("Invalid expression")

        # Return result with 2 decimal places precision
        return stack[0].quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)

    def evaluate(self, expression: str) -> Decimal:
        """
        Evaluate a mathematical expression.

        Args:
            expression: Mathematical expression as string

        Returns:
            Result as Decimal with 2 decimal places precision

        Raises:
            ValueError: If expression is invalid or contains unsupported operations
        """
        try:
            tokens = self.tokenize(expression)
            rpn_tokens = self._shunting_yard(tokens)
            result = self._evaluate_rpn(rpn_tokens)
            return result
        except Exception as e:
            raise ValueError(f"Expression evaluation failed: {str(e)}")


def create_rules_evaluator(project_requirements: Dict) -> RulesEvaluator:
    """
    Factory function to create a RulesEvaluator from project requirements.

    Args:
        project_requirements: Project requirements dictionary

    Returns:
        Configured RulesEvaluator instance
    """
    # Extract variables from project requirements
    variables = {}

    # Common variables
    if 'area_m2' in project_requirements:
        variables['areaM2'] = project_requirements['area_m2']

    if 'has_plumbing_work' in project_requirements:
        variables['hasPlumbingWork'] = project_requirements['has_plumbing_work']

    if 'has_electrical_work' in project_requirements:
        variables['hasElectricalWork'] = project_requirements['has_electrical_work']

    if 'room_type' in project_requirements:
        variables['roomType'] = project_requirements['room_type']

    if 'finish_level' in project_requirements:
        variables['finishLevel'] = project_requirements['finish_level']

    # Add any other variables from the requirements
    for key, value in project_requirements.items():
        if key not in ['area_m2', 'has_plumbing_work', 'has_electrical_work', 'room_type', 'finish_level']:
            variables[key] = value

    return RulesEvaluator(variables)
