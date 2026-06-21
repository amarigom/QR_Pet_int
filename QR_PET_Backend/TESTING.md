# Testing Guide - QR Pet System

## Overview

Complete testing strategy for QR Pet backend and frontend systems.

## Backend Testing

### Setup

```bash
# Install testing dependencies
pip install -r requirements-test.txt

# Or individual tools
pip install pytest pytest-asyncio pytest-cov httpx
```

### Running Tests

```bash
# Run all tests
pytest

# Run specific test file
pytest tests/unit/services/test_email_service.py

# Run specific test class
pytest tests/unit/services/test_email_service.py::TestEmailService

# Run specific test
pytest tests/unit/services/test_email_service.py::TestEmailService::test_send_email_with_mock_provider

# Run tests by marker
pytest -m asyncio
pytest -m "not slow"

# Run with verbose output
pytest -v

# Run with coverage report
pytest --cov=app --cov-report=html

# Run tests in parallel
pytest -n auto

# Run with specific log level
pytest --log-cli-level=DEBUG
```

### Test Structure

```
tests/
├── conftest.py           # Shared fixtures
├── unit/                 # Unit tests
│   ├── services/
│   │   ├── test_email_service.py
│   │   ├── test_reminder_service.py
│   │   └── test_medical_record_service.py
│   └── repositories/
├── integration/          # Integration tests
│   ├── test_pet_registration_flow.py
│   ├── test_appointment_flow.py
│   └── test_email_notifications.py
└── fixtures/             # Test data
```

### Unit Tests

**EmailService Tests** (`test_email_service.py`)
- ✅ Send email with MockProvider
- ✅ Send vaccine reminder
- ✅ Send appointment reminder
- ✅ Send medical record notification
- ✅ Retry logic and error handling
- ✅ Multiple recipient types

**ReminderService Tests** (`test_reminder_service.py`)
- ✅ Create reminders
- ✅ Send pending reminders in batch
- ✅ Get statistics
- ✅ Status tracking

**MedicalRecordService Tests** (`test_medical_record_service.py`)
- ✅ Create medical records
- ✅ Get medical history
- ✅ Update treatment progress

### Integration Tests

**Pet Registration Flow** (`test_pet_registration_flow.py`)
- ✅ Vet registers pet with new owner
- ✅ Vet registers pet with existing owner
- ✅ Owner scans QR and registers pet

**Appointment Flow** (`test_appointment_flow.py`)
- ✅ Full lifecycle: create → confirm → complete
- ✅ Appointment with automatic reminder
- ✅ Cancel appointment with notification

**Email Notifications** (`test_email_notifications.py`)
- ✅ Vaccine reminder sent
- ✅ Appointment confirmation sent
- ✅ Medical record notification sent
- ✅ Batch email sending

### Fixtures

All fixtures are defined in `conftest.py`:

```python
# Database
test_db              # AsyncSession for testing

# HTTP Client
client              # AsyncClient for API testing

# Email
mock_email_provider # MockProvider for email testing

# Sample Data
sample_user_data
sample_veterinarian_data
sample_clinic_data
sample_pet_data
sample_appointment_data
sample_medical_record_data
sample_vaccine_data
```

### Coverage Goals

- **Overall:** 80%+ coverage
- **Services:** 85%+ coverage
- **Repositories:** 80%+ coverage
- **Models:** 70%+ coverage
- **Critical paths:** 100% coverage

### Generate Coverage Report

```bash
# Terminal report
pytest --cov=app --cov-report=term-missing

# HTML report
pytest --cov=app --cov-report=html
# Open htmlcov/index.html

# XML report (for CI/CD)
pytest --cov=app --cov-report=xml
```

## Frontend Testing

### Setup

```bash
cd frontend

# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest @babel/preset-react

# Or with specific versions
npm install --save-dev --legacy-peer-deps
```

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- test_email_service

# Run with coverage
npm test -- --coverage

# Run specific test suite
npm test -- --testNamePattern="EmailService"
```

### Test Structure

```
frontend/tests/
├── unit/
│   ├── components/
│   │   ├── VeterinaryDashboard.test.tsx
│   │   ├── MedicalRecordForm.test.tsx
│   │   └── AppointmentCard.test.tsx
│   └── hooks/
│       └── useAppointments.test.ts
└── integration/
    ├── register-pet.test.tsx
    ├── appointment-flow.test.tsx
    └── medical-records.test.tsx
```

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-python@v2
        with:
          python-version: "3.10"
      - run: pip install -r QR_PET_Backend/requirements-test.txt
      - run: pytest QR_PET_Backend/tests --cov --cov-report=xml
      - uses: codecov/codecov-action@v2

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: "18"
      - run: cd frontend && npm install
      - run: npm test -- --coverage
      - uses: codecov/codecov-action@v2
```

## Debugging Tests

### Add Debug Output

```python
# In test function
await service.some_method()
print("[DEBUG] Result:", result)  # or use logger
```

### Run Single Test with Output

```bash
pytest tests/unit/services/test_email_service.py::TestEmailService::test_send_email_with_mock_provider -v -s
```

### Use Python Debugger

```python
# In test
import pdb; pdb.set_trace()

# Then in pytest
pytest tests/... --pdb
```

## Best Practices

1. **Test Isolation:** Each test should be independent
2. **Use Fixtures:** Share common setup via fixtures
3. **Mock External Services:** Use MockProvider for email, etc.
4. **Test Edge Cases:** Include error scenarios
5. **Keep Tests Fast:** Use in-memory database (SQLite)
6. **Clear Names:** Test names should describe what is tested
7. **One Assertion:** Try to have one main assertion per test (or group related)
8. **DRY:** Don't repeat test code, use fixtures and helper functions

## Performance

- **Unit Tests:** Should run in < 1ms each
- **Integration Tests:** Should run in < 100ms each
- **Full Suite:** Should complete in < 5 minutes

## Known Issues & TODOs

- Some integration tests have TODO comments for factory methods
- Need to implement factory methods for PetVeterinaryLinkFactory
- Need to implement missing service methods (marked with TODO)

## Contributing

When adding new features:

1. Write tests first (TDD) or alongside code
2. Ensure coverage > 80%
3. Run full test suite before PR
4. Update this file with new test categories

## Resources

- [Pytest Documentation](https://docs.pytest.org/)
- [Pytest AsyncIO](https://pytest-asyncio.readthedocs.io/)
- [FastAPI Testing](https://fastapi.tiangolo.com/advanced/testing-events/)
- [Testing React](https://react.dev/learn/testing-react-apps)
