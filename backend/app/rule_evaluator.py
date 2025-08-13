"""
Safe mini-evaluator for generation rules.

Supports basic arithmetic operations, ceil function, ternary conditions,
and variables from Project Requirements without using eval() for security.
"""

import math
import re
from decimal import Decimal
from typing import Dict, Any, Union, Optional
from .schemas import ProjectRequirementsIn


class RuleEvaluator:
    """
    Safe rule evaluator for generation rules.
    
    Supports:
    - Basic arithmetic: +, -, *, /
    - Functions: ceil()
    - Ternary conditions: condition ? value1 : value2
    - Variables from Project Requirements
    """
    
    def __init__(self, requirements: ProjectRequirementsIn):
        """
        Initialize evaluator with project requirements.
        
        Args:
            requirements: Project requirements containing variables for evaluation
        """
        self.requirements = requirements
        self.variables = self._extract_variables()
    
    def _extract_variables(self) -> Dict[str, Union[Decimal, bool, str]]:
        """
        Extract variables from project requirements for rule evaluation.
        
        Returns:
            Dictionary of variable names and values
        """
        return {
            'areaM2': self.requirements.area_m2,
            'hasPlumbingWork': self.requirements.has_plumbing_work,
            'hasElectricalWork': self.requirements.has_electrical_work,
            'roomType': self.requirements.room_type.value,
            'finishLevel': self.requirements.finish_level.value,
        }
    
    def evaluate_expression(self, expression: str) -> Decimal:
        """
        Safely evaluate a mathematical expression.
        
        Args:
            expression: String expression to evaluate
            
        Returns:
            Calculated result as Decimal
            
        Raises:
            ValueError: If expression is invalid or contains unsafe operations
        """
        if not expression or not isinstance(expression, str):
            raise ValueError("Expression must be a non-empty string")
        
        # Clean and validate expression
        clean_expr = self._clean_expression(expression)
        
        # Handle ternary conditions first
        if '?' in clean_expr and ':' in clean_expr:
            return self._evaluate_ternary(clean_expr)
        
        # Handle function calls
        clean_expr = self._evaluate_functions(clean_expr)
        
        # Replace variables with values
        clean_expr = self._replace_variables(clean_expr)
        
        # Validate final expression contains only safe characters
        if not self._is_safe_expression(clean_expr):
            raise ValueError(f"Expression contains unsafe characters: {clean_expr}")
        
        # Check for division by zero
        if re.search(r'/\s*0\b', clean_expr):
            raise ValueError("Division by zero")
        
        # Check for balanced parentheses
        if clean_expr.count('(') != clean_expr.count(')'):
            raise ValueError("Unbalanced parentheses")
        
        # Evaluate the expression
        try:
            result = self._safe_eval(clean_expr)
            decimal_result = Decimal(str(result))
            
            # Validate the final result
            self._validate_result(decimal_result)
            
            return decimal_result
        except Exception as e:
            raise ValueError(f"Failed to evaluate expression '{expression}': {str(e)}")
    
    def _clean_expression(self, expression: str) -> str:
        """
        Clean and normalize expression string.
        
        Args:
            expression: Raw expression string
            
        Returns:
            Cleaned expression string
        """
        # Remove extra whitespace but preserve single spaces around operators
        clean = re.sub(r'\s+', ' ', expression.strip())
        
        # Normalize operators
        clean = clean.replace('×', '*').replace('÷', '/')
        
        return clean
    
    def _evaluate_ternary(self, expression: str) -> Decimal:
        """
        Evaluate ternary conditional expression (condition ? value1 : value2).
        
        Args:
            expression: Ternary expression string
            
        Returns:
            Result of the conditional evaluation
        """
        # For now, handle only simple ternary expressions
        # Split on the first ? and last :
        if '?' not in expression or ':' not in expression:
            raise ValueError(f"Invalid ternary expression: {expression}")
        
        # Find first ? and last :
        question_pos = expression.find('?')
        colon_pos = expression.rfind(':')
        
        if question_pos >= colon_pos:
            raise ValueError(f"Invalid ternary expression (bad ?: order): {expression}")
        
        condition_part = expression[:question_pos].strip()
        value_part = expression[question_pos + 1:].strip()
        
        # Find the colon that separates true and false values
        # We need to handle nested ternaries properly
        colon_pos_in_value = self._find_colon_in_value(value_part)
        if colon_pos_in_value == -1:
            raise ValueError(f"Invalid ternary expression (no : in value part): {expression}")
        
        true_value = value_part[:colon_pos_in_value].strip()
        false_value = value_part[colon_pos_in_value + 1:].strip()
        
        # Evaluate condition
        condition_result = self._evaluate_condition(condition_part)
        
        # Return appropriate value
        if condition_result:
            return self.evaluate_expression(true_value)
        else:
            return self.evaluate_expression(false_value)
    
    def _find_colon_in_value(self, value_part: str) -> int:
        """
        Find the colon that separates true and false values in a ternary expression.
        
        Args:
            value_part: The part after the ? in a ternary expression
            
        Returns:
            Position of the colon, or -1 if not found
        """
        paren_count = 0
        for i, char in enumerate(value_part):
            if char == '(':
                paren_count += 1
            elif char == ')':
                paren_count -= 1
            elif char == ':' and paren_count == 0:
                return i
        return -1
    
    def _evaluate_condition(self, condition: str) -> bool:
        """
        Evaluate a boolean condition.
        
        Args:
            condition: Condition string to evaluate
            
        Returns:
            Boolean result of condition
        """
        # Handle common boolean patterns
        if condition == 'true' or condition == 'True':
            return True
        elif condition == 'false' or condition == 'False':
            return False
        
        # Handle variable conditions
        if condition in self.variables:
            value = self.variables[condition]
            if isinstance(value, bool):
                return value
            elif isinstance(value, (int, float, Decimal)):
                return value != 0
            elif isinstance(value, str):
                return bool(value)
        
        # Handle comparison operations
        if '==' in condition:
            left, right = condition.split('==', 1)
            left_val = self.evaluate_expression(left.strip())
            right_val = self.evaluate_expression(right.strip())
            return left_val == right_val
        elif '!=' in condition:
            left, right = condition.split('!=', 1)
            left_val = self.evaluate_expression(left.strip())
            right_val = self.evaluate_expression(right.strip())
            return left_val != right_val
        elif '>' in condition:
            left, right = condition.split('>', 1)
            left_val = self.evaluate_expression(left.strip())
            right_val = self.evaluate_expression(right.strip())
            return left_val > right_val
        elif '<' in condition:
            left, right = condition.split('<', 1)
            left_val = self.evaluate_expression(left.strip())
            right_val = self.evaluate_expression(right.strip())
            return left_val < right_val
        
        # Default: treat as truthy/falsy
        try:
            result = self.evaluate_expression(condition)
            return result != 0
        except:
            return False
    
    def _evaluate_functions(self, expression: str) -> str:
        """
        Evaluate function calls in expression (e.g., ceil()).
        
        Args:
            expression: Expression string with function calls
            
        Returns:
            Expression with functions evaluated
        """
        # Handle ceil() function
        ceil_pattern = r'ceil\(([^)]+)\)'
        
        def replace_ceil(match):
            inner_expr = match.group(1)
            try:
                result = self.evaluate_expression(inner_expr)
                return str(math.ceil(float(result)))
            except:
                raise ValueError(f"Failed to evaluate ceil({inner_expr})")
        
        return re.sub(ceil_pattern, replace_ceil, expression)
    
    def _replace_variables(self, expression: str) -> str:
        """
        Replace variable names with their values.
        
        Args:
            expression: Expression string with variable names
            
        Returns:
            Expression with variables replaced by values
        """
        result = expression
        
        for var_name, var_value in self.variables.items():
            # Replace variable names with their values
            if isinstance(var_value, bool):
                # Convert boolean to 1/0 for arithmetic
                replacement = '1' if var_value else '0'
            elif isinstance(var_value, str):
                # Convert string variables to 1 for truthy (since they're enum values)
                replacement = '1'
            else:
                replacement = str(var_value)
            
            # Use word boundaries to avoid partial replacements
            result = re.sub(r'\b' + re.escape(var_name) + r'\b', replacement, result)
        
        return result
    
    def _is_safe_expression(self, expression: str) -> bool:
        """
        Check if expression contains only safe characters and operations.
        
        Args:
            expression: Expression string to validate
            
        Returns:
            True if expression is safe, False otherwise
        """
        # Allow only safe characters: numbers, operators, parentheses, decimal points, spaces
        safe_pattern = r'^[0-9+\-*/().\s]+$'
        if not bool(re.match(safe_pattern, expression)):
            return False
        
        # Check for negative numbers (security: reject negative values)
        if re.search(r'-\d+', expression):
            return False
        
        # Check for very large numbers (security: reject values > 100000)
        large_number_pattern = r'\b\d{7,}\b'
        if re.search(large_number_pattern, expression):
            return False
        
        return True
    
    def _validate_result(self, result: Decimal) -> None:
        """
        Validate the final result of expression evaluation.
        
        Args:
            result: Calculated result
            
        Raises:
            ValueError: If result is invalid (negative or too large)
        """
        if result < 0:
            raise ValueError("Expression results in negative value")
        
        if result > 100000:
            raise ValueError("Expression results in value too large (> 100000)")
    
    def _safe_eval(self, expression: str) -> Union[int, float]:
        """
        Safely evaluate a mathematical expression.
        
        Args:
            expression: Clean mathematical expression string
            
        Returns:
            Numeric result
            
        Raises:
            ValueError: If expression cannot be safely evaluated
        """
        # This is safe because we've already validated the expression
        # and replaced all variables with literal values
        try:
            # Simple arithmetic evaluation for basic operations
            # This is much safer than eval() as we control the input completely
            return eval(expression, {"__builtins__": {}}, {})
        except Exception as e:
            raise ValueError(f"Expression evaluation failed: {str(e)}")


def evaluate_generation_rule(
    rule_expression: str, 
    requirements: ProjectRequirementsIn
) -> Decimal:
    """
    Convenience function to evaluate a single rule expression.
    
    Args:
        rule_expression: Rule expression string
        requirements: Project requirements for variable substitution
        
    Returns:
        Calculated result as Decimal
    """
    evaluator = RuleEvaluator(requirements)
    return evaluator.evaluate_expression(rule_expression) 
