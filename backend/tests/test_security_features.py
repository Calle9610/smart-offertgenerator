import pytest
from decimal import Decimal
from app.rule_evaluator import RuleEvaluator
from app.schemas import ProjectRequirementsIn, RoomType, FinishLevel


class TestRuleEvaluatorSecurity:
    """Test security features of the RuleEvaluator."""
    
    def setup_method(self):
        """Setup test requirements for each test."""
        self.requirements = ProjectRequirementsIn(
            room_type=RoomType.BATHROOM,
            area_m2=Decimal("15.5"),
            finish_level=FinishLevel.STANDARD,
            has_plumbing_work=True,
            has_electrical_work=False,
            material_prefs=[],
            site_constraints=[],
            notes=None
        )
        self.evaluator = RuleEvaluator(self.requirements)
    
    def test_reject_dangerous_functions(self):
        """Test that dangerous functions are rejected."""
        dangerous_expressions = [
            "import('os')",
            "eval('print(1)')",
            "exec('x=1')",
            "open('file.txt')",
            "__import__('os')",
            "globals()",
            "locals()",
            "vars()",
            "dir()",
            "help()"
        ]
        
        for expr in dangerous_expressions:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_file_operations(self):
        """Test that file operations are rejected."""
        file_expressions = [
            "open('test.txt')",
            "file('test.txt')",
            "read()",
            "write()"
        ]
        
        for expr in file_expressions:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_network_operations(self):
        """Test that network operations are rejected."""
        network_expressions = [
            "socket()",
            "connect()",
            "send()",
            "recv()",
            "http()",
            "urlopen()"
        ]
        
        for expr in network_expressions:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_system_commands(self):
        """Test that system commands are rejected."""
        system_expressions = [
            "system('ls')",
            "popen('cat file')",
            "call('rm -rf')",
            "run('echo hello')"
        ]
        
        for expr in system_expressions:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_large_numbers(self):
        """Test that very large numbers are rejected."""
        large_expressions = [
            "1000001",  # > 1000000
            "999999999",
            "areaM2 * 1000000",
            "1000000 + 1"
        ]
        
        for expr in large_expressions:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_negative_results(self):
        """Test that expressions resulting in negative values are rejected."""
        negative_expressions = [
            "areaM2 - 20",  # 15.5 - 20 = -4.5
            "0 - 1",
            "areaM2 - areaM2 - 1"
        ]
        
        for expr in negative_expressions:
            with pytest.raises(ValueError, match="Expression results in negative value"):
                self.evaluator.evaluate_expression(expr)
    
    def test_reject_division_by_zero(self):
        """Test that division by zero is rejected."""
        with pytest.raises(ValueError, match="Division by zero"):
            self.evaluator.evaluate_expression("10 / 0")
        
        with pytest.raises(ValueError, match="Division by zero"):
            self.evaluator.evaluate_expression("areaM2 / 0")
    
    def test_reject_unbalanced_parentheses(self):
        """Test that unbalanced parentheses are rejected."""
        unbalanced_expressions = [
            "(5 + 3",
            "5 + 3)",
            "((5 + 3)",
            "(5 + 3))"
        ]
        
        for expr in unbalanced_expressions:
            with pytest.raises(ValueError, match="Unbalanced parentheses"):
                self.evaluator.evaluate_expression(expr)
    
    def test_allow_safe_expressions(self):
        """Test that safe expressions are allowed."""
        safe_expressions = [
            "5 + 3",
            "areaM2 * 2",
            "ceil(areaM2 / 10)",
            "hasPlumbingWork ? 6 : 0",
            "(3 + 2) * 4"
        ]
        
        for expr in safe_expressions:
            try:
                result = self.evaluator.evaluate_expression(expr)
                assert isinstance(result, Decimal)
                assert result >= 0
            except Exception as e:
                pytest.fail(f"Safe expression '{expr}' failed: {e}")
    
    def test_variable_injection_protection(self):
        """Test that variable injection is protected against."""
        # Test that only allowed variables can be accessed
        allowed_vars = ["areaM2", "hasPlumbingWork", "hasElectricalWork"]
        
        for var in allowed_vars:
            try:
                result = self.evaluator.evaluate_expression(var)
                assert isinstance(result, (Decimal, int))
            except Exception as e:
                pytest.fail(f"Allowed variable '{var}' failed: {e}")
        
        # Test that disallowed variables are rejected
        disallowed_vars = ["__dict__", "__class__", "os", "sys", "subprocess"]
        
        for var in disallowed_vars:
            with pytest.raises(ValueError, match="Expression contains unsafe characters"):
                self.evaluator.evaluate_expression(var) 
