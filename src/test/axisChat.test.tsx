import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import AxisChat from "@/components/AxisChat";

describe("AxisChat", () => {
  it("mostra galeria de fotos quando usuário pede mais fotos em página de imóvel", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch" as any).mockImplementation(async () => {
      throw new Error("fetch não deveria ser chamado para intenção de fotos");
    });

    render(
      <AxisChat
        isOpen={true}
        onClose={() => {}}
        propertyContext={{
          id: "prop-1",
          title: "Imóvel Teste",
          images: ["/img1.webp", "/img2.webp", "/img3.webp"],
        }}
      />
    );

    const input = screen.getByPlaceholderText("Digite sua mensagem...");
    fireEvent.change(input, { target: { value: "quero ver mais fotos" } });
    fireEvent.submit(input.closest("form")!);

    expect(await screen.findByText(/aqui estão mais fotos/i)).toBeTruthy();
    expect(screen.getByText(/abrir galeria/i)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

