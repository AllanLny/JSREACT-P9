/**
 * @jest-environment jsdom
 */

import { screen, fireEvent, waitFor } from '@testing-library/dom';
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import router from "../app/Router"
import { ROUTES_PATH } from "../constants/routes"

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page and I submit the form", () => {
    document.body.innerHTML = NewBillUI();
    test("Then an alert should be displayed if the file extension is not allowed", () => {
      const mockFile = new File([''], 'test.webp');

      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: 'C:\\fakepath\\test.webp',
          files: [mockFile]
        }
      };
      const mockDocument = {
        querySelector: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
          files: [mockFile],
          value: ''
        })
      };
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          create: jest.fn()
        })
      };
      const newBill = new NewBill({ document: mockDocument, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });
      window.alert = jest.fn();
      newBill.handleChangeFile(mockEvent);

      expect(window.alert).toHaveBeenCalledWith('Veuillez sélectionner un fichier avec une extension jpg, jpeg ou png.');
    })

    test("Then no files submit ", () => {
      // Set up the mock event with no files
      const mockEvent = {
        preventDefault: jest.fn(),
        target: {
          value: '',
          files: []
        }
      };

      const mockDocument = {
        querySelector: jest.fn().mockReturnValue({
          addEventListener: jest.fn(),
          files: [],
          value: ''
        })
      };
      const mockStore = {
        bills: jest.fn().mockReturnValue({
          create: jest.fn()
        })
      };
      const newBill = new NewBill({ document: mockDocument, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

      console.error = jest.fn();

      newBill.handleChangeFile(mockEvent);

      expect(console.error).toHaveBeenCalledWith("Aucun fichier sélectionné");

      expect(newBill.fileErrorMessage).toBe("Aucun fichier sélectionné");

    });

    test("Call handleSubmit when the form is submitted", async () => {
      // Setup
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      });
      window.localStorage.setItem(
        "user",
        JSON.stringify({
          type: "Employee",
        })
      );

      const spyHandleSubmit = jest.fn();
      const newBill = new NewBill({
        document,
        onNavigate: () => { },
        store: mockStore,
        localStorage: window.localStorage,
      });
      newBill.handleSubmit = spyHandleSubmit;

      await waitFor(() => screen.getByTestId("form-new-bill"));

      const form = screen.getByTestId("form-new-bill");
      form.removeEventListener("submit", newBill.handleSubmit);
      form.addEventListener("submit", spyHandleSubmit);

      fireEvent.submit(form);

      await waitFor(() => {
        expect(spyHandleSubmit).toHaveBeenCalled();
      });
    });

  })
});

describe("When I am on NewBill Page and I submit the form", () => {
  let getItemSpy;

  beforeEach(() => {
    // Mock localStorage.getItem
    getItemSpy = jest.spyOn(window.localStorage, 'getItem');
    getItemSpy.mockImplementation((key) => {
      if (key === 'user') {
        return JSON.stringify({ email: 'test@example.com' });
      }
    });
  });

  afterEach(() => {
    // Clean up the mock after each test
    getItemSpy.mockRestore();
  });

  test("Then the file should be uploaded correctly if valid extension", async () => {
    // Set up the mock event with a file
    const mockFile = new File([''], 'test.jpg');

    const mockEvent = {
      preventDefault: jest.fn(),
      target: {
        value: 'C:\\fakepath\\test.jpg',
        files: [mockFile]
      }
    };
    const mockDocument = {
      querySelector: jest.fn().mockReturnValue({
        addEventListener: jest.fn(),
        files: [mockFile],
        value: ''
      })
    };
    const mockStore = {
      bills: jest.fn().mockReturnValue({
        create: jest.fn().mockResolvedValue({ fileUrl: 'url', key: 'key' })
      })
    };
    const newBill = new NewBill({ document: mockDocument, onNavigate: jest.fn(), store: mockStore, localStorage: window.localStorage });

    await newBill.handleChangeFile(mockEvent);

    expect(newBill.fileUrl).toBe('url');
    expect(newBill.fileName).toBe('test.jpg');
    expect(newBill.billId).toBe('key');
  });
});






















// test d'intégration POST// 
describe("Given I am a user connected", () => {
  describe("When I am on New Bill page and I submit a form", () => {
    test("It should call the API POST method to create a new bill", async () => {
      const newBill = new NewBill({
        document,
        onNavigate: () => { },
        store: mockStore,
        localStorage: window.localStorage,
      });

      const handleSubmit = jest.fn(newBill.handleSubmit);

      const form = screen.getByTestId("form-new-bill");

      form.addEventListener("submit", handleSubmit);

      fireEvent.submit(form);

      await waitFor(() => {
        expect(handleSubmit).toHaveBeenCalled();
      });
    });

    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills").mockReturnValue({
          list: jest.fn()
        });
        window.localStorage.setItem(
          "user",
          JSON.stringify({
            type: "Employee",
          })
        );
        const root = document.createElement("div");
        root.setAttribute("id", "root");
        document.body.appendChild(root);
        router();
      });

      test("It fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list: () => {
              return Promise.reject(new Error("Erreur 404"))
            }
          }
        })

        window.onNavigate(ROUTES_PATH.Bills);
        await new Promise(process.nextTick);
        const message = await screen.findByText(/Erreur 404/);
        expect(message).toBeTruthy();
      })

      // test("It fails with 500 message error", async () => {
      //   mockStore.bills.mockImplementationOnce(() => {
      //     return {
      //       list: () => {
      //         return Promise.reject(new Error("Erreur 500"))
      //       }
      //     }
      //   })

      //   window.onNavigate(ROUTES_PATH.Bills);
      //   await new Promise(process.nextTick);
      //   const message = await screen.findByText(/Erreur 500/);
      //   expect(message).toBeTruthy();
      // })
    });
  });
}); 
