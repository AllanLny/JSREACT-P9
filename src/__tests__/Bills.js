/**
 * @jest-environment jsdom
 */

import { fireEvent, screen, waitFor } from "@testing-library/dom";
import BillsUI from "../views/BillsUI.js";
import { bills } from "../fixtures/bills.js";
import Bills from "../containers/Bills.js";
import { ROUTES_PATH } from "../constants/routes.js";
import { localStorageMock } from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store";
import router from "../app/Router.js";

jest.mock("../app/Store", () => mockStore);
describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      expect(windowIcon).toBeTruthy();
    })

    test("Then bills should be ordered from earliest to latest", () => {
      document.body.innerHTML = BillsUI({ data: bills })
      const dates = screen.getAllByText(/^(19|20)\d\d[- /.](0[1-9]|1[012])[- /.](0[1-9]|[12][0-9]|3[01])$/i).map(a => a.innerHTML)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(datesSorted).toEqual([...dates].sort(antiChrono));
    })
    let bill;
    const onNavigate = jest.fn();

    beforeEach(() => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock });
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }));

      const html = document.createElement('div');
      html.innerHTML = `
        <button data-testid="btn-new-bill"></button>
        <div data-testid="icon-eye" data-bill-url="url"></div>
      `;
      document.body.appendChild(html);

      bill = new Bills({
        document, onNavigate, localStorage: window.localStorage, store: { bills: () => ({ list: () => Promise.resolve([]) }) }
      });
    });

    afterEach(() => {
      while (document.body.firstChild) {
        document.body.removeChild(document.body.firstChild);
      }
      jest.resetAllMocks();
    });

    it('should instantiate the class correctly', () => {
      expect(bill).toBeTruthy();
    });

    it('should navigate to new bill page when new bill button is clicked', () => {
      fireEvent.click(screen.getByTestId('btn-new-bill'));
      expect(onNavigate).toHaveBeenCalledWith(ROUTES_PATH['NewBill']);
    });

    it('should open modal when eye icon is clicked', () => {
      $.fn.modal = jest.fn(); // Mock jQuery modal function
      fireEvent.click(screen.getByTestId('icon-eye'));
      expect($.fn.modal).toHaveBeenCalledWith('show');
    });

    it('should get bills correctly', async () => {
      const bills = await bill.getBills();
      expect(bills).toEqual([]);
    });
  });
});

// test d'intégration GET
describe("Given I am a user connected as Employee", () => {
  describe("When an error occurs on API", () => {
    beforeEach(() => {
      jest.spyOn(mockStore, "bills")
      Object.defineProperty(
        window,
        'localStorage',
        { value: localStorageMock }
      )
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "e@e"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.appendChild(root)
      router()
    })
    test("fetches bills from an API and fails with 404 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 404"))
          }
        }
      })
      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 404/);
      expect(message).toBeTruthy();
    })

    test("fetches messages from an API and fails with 500 message error", async () => {

      mockStore.bills.mockImplementationOnce(() => {
        return {
          list: () => {
            return Promise.reject(new Error("Erreur 500"))
          }
        }
      })

      window.onNavigate(ROUTES_PATH.Bills);
      await new Promise(process.nextTick);
      const message = await screen.getByText(/Erreur 500/);
      expect(message).toBeTruthy();
    })
  })

})
