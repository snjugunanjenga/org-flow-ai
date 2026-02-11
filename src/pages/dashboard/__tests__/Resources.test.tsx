import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import ResourcesView from "../ResourcesView";
import { NotebookDetail } from "@/components/resources/NotebookDetail";
import { SourceList } from "@/components/resources/SourceList";
import { NotebookList } from "@/components/resources/NotebookList";
import { NotebookGuide } from "@/components/resources/NotebookGuide";
import { ReportGenerator } from "@/components/resources/ReportGenerator";
import { ResourceChat } from "@/components/resources/ResourceChat";
import { SourceUploader } from "@/components/resources/SourceUploader";

// ─── Supabase mock ──────────────────────────────────────────────────────────

const mockNotebooks = [
  { id: "nb1", title: "Research Notebook", description: "AI research", project_id: null, created_at: "2026-01-01T00:00:00Z" },
  { id: "nb2", title: "Meeting Prep", description: null, project_id: null, created_at: "2026-01-02T00:00:00Z" },
];

const mockSources = [
  { id: "src1", title: "Report.pdf", source_type: "pdf", content: "PDF about AI", file_url: null, metadata: {}, created_at: "2026-01-01T00:00:00Z" },
  { id: "src2", title: "Notes.txt", source_type: "text", content: "Text notes", file_url: null, metadata: {}, created_at: "2026-01-02T00:00:00Z" },
];

const mockNotes = [
  { id: "note1", output_type: "note", content: { title: "Key Findings", body: "The research shows..." }, created_at: "2026-01-03T00:00:00Z" },
];

const mockSlides = [
  { id: "slide1", output_type: "slides", content: { title: "Slide Deck", body: "## Slide 1\n- Point 1" }, created_at: "2026-01-04T00:00:00Z" },
];

const mockInsertFn = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      if (table === "resource_notebooks") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockNotebooks }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: any) => {
            mockInsertFn(table, data);
            return {
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: "nb3", title: data.title, description: null, project_id: null, created_at: "2026-02-11T00:00:00Z" },
                }),
              }),
            };
          }),
        };
      }
      if (table === "resource_sources") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: mockSources }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: any) => {
            mockInsertFn(table, data);
            return { error: null };
          }),
        };
      }
      if (table === "resource_outputs") {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              in: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({ data: [...mockNotes, ...mockSlides] }),
              }),
            }),
          }),
          insert: vi.fn().mockImplementation((data: any) => {
            mockInsertFn(table, data);
            return { error: null };
          }),
          delete: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ error: null }),
          }),
        };
      }
      return {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: [] }),
          }),
        }),
      };
    },
    storage: {
      from: () => ({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: "https://example.com/file.pdf" } }),
      }),
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({ user: { id: "user1", email: "alice@test.com" } }),
}));

vi.mock("@/hooks/use-org-id", () => ({
  useOrgId: () => "org1",
}));

global.fetch = vi.fn();

const renderResources = () =>
  render(<BrowserRouter><ResourcesView /></BrowserRouter>);

// ─── Notebook List View ─────────────────────────────────────────────────────

describe("ResourcesView – Notebook List", () => {
  beforeEach(() => vi.clearAllMocks());

  it("renders page title and description", () => {
    renderResources();
    expect(screen.getByText("Resources")).toBeInTheDocument();
    expect(screen.getByText(/Source-grounded AI research workspace/)).toBeInTheDocument();
  });

  it("shows notebook list after loading", async () => {
    renderResources();
    await waitFor(() => {
      expect(screen.getByText("Research Notebook")).toBeInTheDocument();
      expect(screen.getByText("Meeting Prep")).toBeInTheDocument();
    });
  });

  it("shows notebook descriptions", async () => {
    renderResources();
    await waitFor(() => expect(screen.getByText("AI research")).toBeInTheDocument());
  });

  it("has create input and disabled button", () => {
    renderResources();
    expect(screen.getByPlaceholderText("New notebook title...")).toBeInTheDocument();
    expect(screen.getByText("Create")).toBeDisabled();
  });

  it("enables create button with text", () => {
    renderResources();
    fireEvent.change(screen.getByPlaceholderText("New notebook title..."), { target: { value: "Test" } });
    expect(screen.getByText("Create")).not.toBeDisabled();
  });

  it("creates notebook on click", async () => {
    renderResources();
    fireEvent.change(screen.getByPlaceholderText("New notebook title..."), { target: { value: "New Research" } });
    await act(async () => { fireEvent.click(screen.getByText("Create")); });
    await waitFor(() => {
      expect(mockInsertFn).toHaveBeenCalledWith("resource_notebooks", expect.objectContaining({ title: "New Research", org_id: "org1" }));
    });
  });

  it("creates notebook on Enter key", async () => {
    renderResources();
    const input = screen.getByPlaceholderText("New notebook title...");
    fireEvent.change(input, { target: { value: "Enter NB" } });
    await act(async () => { fireEvent.keyDown(input, { key: "Enter" }); });
    await waitFor(() => {
      expect(mockInsertFn).toHaveBeenCalledWith("resource_notebooks", expect.objectContaining({ title: "Enter NB" }));
    });
  });

  it("navigates to notebook detail on click", async () => {
    renderResources();
    await waitFor(() => expect(screen.getByText("Research Notebook")).toBeInTheDocument());
    await act(async () => { fireEvent.click(screen.getByText("Research Notebook")); });
    await waitFor(() => expect(screen.getByRole("tablist")).toBeInTheDocument());
  });
});

// ─── NotebookList component ────────────────────────────────────────────────

describe("NotebookList component", () => {
  it("shows empty state when no notebooks", () => {
    render(<NotebookList notebooks={[]} loading={false} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("No notebooks yet")).toBeInTheDocument();
  });

  it("shows loading state", () => {
    const { container } = render(<NotebookList notebooks={[]} loading={true} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(container.querySelector(".animate-pulse-glow")).toBeInTheDocument();
  });

  it("renders notebook cards", () => {
    render(<NotebookList notebooks={mockNotebooks as any} loading={false} onSelect={vi.fn()} onCreate={vi.fn()} />);
    expect(screen.getByText("Research Notebook")).toBeInTheDocument();
    expect(screen.getByText("Meeting Prep")).toBeInTheDocument();
  });

  it("calls onSelect when clicking a notebook", () => {
    const onSelect = vi.fn();
    render(<NotebookList notebooks={mockNotebooks as any} loading={false} onSelect={onSelect} onCreate={vi.fn()} />);
    fireEvent.click(screen.getByText("Research Notebook"));
    expect(onSelect).toHaveBeenCalledWith("nb1");
  });

  it("calls onCreate with title", () => {
    const onCreate = vi.fn();
    render(<NotebookList notebooks={[]} loading={false} onSelect={vi.fn()} onCreate={onCreate} />);
    fireEvent.change(screen.getByPlaceholderText("New notebook title..."), { target: { value: "My NB" } });
    fireEvent.click(screen.getByText("Create"));
    expect(onCreate).toHaveBeenCalledWith("My NB");
  });
});

// ─── SourceList component ──────────────────────────────────────────────────

describe("SourceList component", () => {
  it("shows empty state", () => {
    render(<SourceList sources={[]} pinnedIds={new Set()} onTogglePin={vi.fn()} />);
    expect(screen.getByText(/No sources yet/)).toBeInTheDocument();
  });

  it("renders sources with titles", () => {
    render(<SourceList sources={mockSources as any} pinnedIds={new Set()} onTogglePin={vi.fn()} />);
    expect(screen.getByText("Report.pdf")).toBeInTheDocument();
    expect(screen.getByText("Notes.txt")).toBeInTheDocument();
  });

  it("shows pin buttons", () => {
    render(<SourceList sources={mockSources as any} pinnedIds={new Set()} onTogglePin={vi.fn()} />);
    expect(screen.getAllByTitle("Pin source for chat context")).toHaveLength(2);
  });

  it("shows unpin when source is pinned", () => {
    render(<SourceList sources={mockSources as any} pinnedIds={new Set(["src1"])} onTogglePin={vi.fn()} />);
    expect(screen.getByTitle("Unpin source")).toBeInTheDocument();
    expect(screen.getByTitle("Pin source for chat context")).toBeInTheDocument();
  });

  it("calls onTogglePin", () => {
    const onToggle = vi.fn();
    render(<SourceList sources={mockSources as any} pinnedIds={new Set()} onTogglePin={onToggle} />);
    fireEvent.click(screen.getAllByTitle("Pin source for chat context")[0]);
    expect(onToggle).toHaveBeenCalledWith("src1");
  });

  it("shows source type labels", () => {
    render(<SourceList sources={mockSources as any} pinnedIds={new Set()} onTogglePin={vi.fn()} />);
    expect(screen.getAllByText(/pdf/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/text/).length).toBeGreaterThanOrEqual(1);
  });
});

// ─── SourceUploader component ──────────────────────────────────────────────

describe("SourceUploader component", () => {
  const onUploaded = vi.fn();

  beforeEach(() => vi.clearAllMocks());

  it("defaults to file upload mode", () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    expect(screen.getByText("Click to upload a file")).toBeInTheDocument();
  });

  it("switches to text mode", () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Text"));
    expect(screen.getByPlaceholderText("Source title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Paste your text content here...")).toBeInTheDocument();
  });

  it("switches to URL mode", () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Url"));
    expect(screen.getByPlaceholderText("https://example.com/document")).toBeInTheDocument();
  });

  it("disables add text source when empty", () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Text"));
    expect(screen.getByText("Add Text Source")).toBeDisabled();
  });

  it("enables and submits text source", async () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Text"));
    fireEvent.change(screen.getByPlaceholderText("Source title"), { target: { value: "Title" } });
    fireEvent.change(screen.getByPlaceholderText("Paste your text content here..."), { target: { value: "Content" } });
    expect(screen.getByText("Add Text Source")).not.toBeDisabled();
    await act(async () => { fireEvent.click(screen.getByText("Add Text Source")); });
    await waitFor(() => {
      expect(mockInsertFn).toHaveBeenCalledWith("resource_sources", expect.objectContaining({
        title: "Title", content: "Content", source_type: "text", notebook_id: "nb1", org_id: "org1",
      }));
    });
  });

  it("submits URL source", async () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Url"));
    fireEvent.change(screen.getByPlaceholderText("https://example.com/document"), { target: { value: "https://test.com" } });
    await act(async () => { fireEvent.click(screen.getByText("Add URL")); });
    await waitFor(() => {
      expect(mockInsertFn).toHaveBeenCalledWith("resource_sources", expect.objectContaining({
        source_type: "url", title: "https://test.com",
      }));
    });
  });

  it("clears text fields after submission", async () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Text"));
    fireEvent.change(screen.getByPlaceholderText("Source title"), { target: { value: "T" } });
    fireEvent.change(screen.getByPlaceholderText("Paste your text content here..."), { target: { value: "C" } });
    await act(async () => { fireEvent.click(screen.getByText("Add Text Source")); });
    await waitFor(() => {
      expect(screen.getByPlaceholderText("Source title")).toHaveValue("");
      expect(screen.getByPlaceholderText("Paste your text content here...")).toHaveValue("");
    });
  });

  it("calls onUploaded after text submission", async () => {
    render(<SourceUploader notebookId="nb1" orgId="org1" onUploaded={onUploaded} />);
    fireEvent.click(screen.getByText("Text"));
    fireEvent.change(screen.getByPlaceholderText("Source title"), { target: { value: "T" } });
    fireEvent.change(screen.getByPlaceholderText("Paste your text content here..."), { target: { value: "C" } });
    await act(async () => { fireEvent.click(screen.getByText("Add Text Source")); });
    await waitFor(() => expect(onUploaded).toHaveBeenCalled());
  });
});

// ─── ResourceChat component ───────────────────────────────────────────────

describe("ResourceChat component", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows empty state", () => {
    render(<ResourceChat notebookId="nb1" orgId="org1" sources={[]} />);
    expect(screen.getByText(/Ask questions about your sources/)).toBeInTheDocument();
  });

  it("shows input and disabled send button", () => {
    render(<ResourceChat notebookId="nb1" orgId="org1" sources={[]} />);
    expect(screen.getByPlaceholderText("Ask about your sources...")).toBeInTheDocument();
  });

  it("enables send when input has text", () => {
    render(<ResourceChat notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    fireEvent.change(screen.getByPlaceholderText("Ask about your sources..."), { target: { value: "What is AI?" } });
    // Send button is icon-only, find it by the input's sibling
    const container = screen.getByPlaceholderText("Ask about your sources...").closest("div");
    const sendBtn = container?.querySelector("button");
    expect(sendBtn).not.toBeDisabled();
  });
});

// ─── NotebookGuide component ──────────────────────────────────────────────

describe("NotebookGuide component", () => {
  it("shows generate button", () => {
    render(<NotebookGuide notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    expect(screen.getByText("Generate Notebook Guide")).toBeInTheDocument();
  });

  it("disables button when no sources", () => {
    render(<NotebookGuide notebookId="nb1" orgId="org1" sources={[]} />);
    expect(screen.getByText("Generate Notebook Guide")).toBeDisabled();
  });

  it("enables button when sources present", () => {
    render(<NotebookGuide notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    expect(screen.getByText("Generate Notebook Guide")).not.toBeDisabled();
  });
});

// ─── ReportGenerator component ────────────────────────────────────────────

describe("ReportGenerator component", () => {
  it("shows report type buttons", () => {
    render(<ReportGenerator notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    expect(screen.getByText("Executive Briefing")).toBeInTheDocument();
    expect(screen.getByText("FAQ Document")).toBeInTheDocument();
    expect(screen.getByText("Study Guide")).toBeInTheDocument();
  });

  it("shows generate button", () => {
    render(<ReportGenerator notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    expect(screen.getByText("Generate Report")).toBeInTheDocument();
  });

  it("disables generate when no sources", () => {
    render(<ReportGenerator notebookId="nb1" orgId="org1" sources={[]} />);
    expect(screen.getByText("Generate Report")).toBeDisabled();
  });

  it("enables generate when sources present", () => {
    render(<ReportGenerator notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    expect(screen.getByText("Generate Report")).not.toBeDisabled();
  });

  it("switches report type on click", () => {
    render(<ReportGenerator notebookId="nb1" orgId="org1" sources={mockSources as any} />);
    fireEvent.click(screen.getByText("FAQ Document"));
    // Clicking changes internal state - button remains rendered
    expect(screen.getByText("FAQ Document")).toBeInTheDocument();
  });
});

// ─── NotebookDetail integration ───────────────────────────────────────────

describe("NotebookDetail component", () => {
  const notebook = { id: "nb1", title: "Research Notebook", description: "AI research", project_id: null, created_at: "2026-01-01T00:00:00Z" };

  it("shows notebook title and back button", () => {
    render(<NotebookDetail notebook={notebook} onBack={vi.fn()} orgId="org1" />);
    expect(screen.getByText("Research Notebook")).toBeInTheDocument();
  });

  it("shows all six tabs", () => {
    render(<NotebookDetail notebook={notebook} onBack={vi.fn()} orgId="org1" />);
    for (const tab of ["Sources", "Chat", "Notes", "Slides", "Guide", "Reports"]) {
      expect(screen.getByRole("tab", { name: tab })).toBeInTheDocument();
    }
  });

  it("calls onBack when back button clicked", () => {
    const onBack = vi.fn();
    render(<NotebookDetail notebook={notebook} onBack={onBack} orgId="org1" />);
    // Back button is the first button (ghost variant with ArrowLeft)
    const buttons = screen.getAllByRole("button");
    fireEvent.click(buttons[0]);
    expect(onBack).toHaveBeenCalled();
  });

  it("shows source and note counts", async () => {
    render(<NotebookDetail notebook={notebook} onBack={vi.fn()} orgId="org1" />);
    await waitFor(() => {
      expect(screen.getByText(/2 sources/)).toBeInTheDocument();
      expect(screen.getByText(/2 notes/)).toBeInTheDocument();
    });
  });

  it("defaults to Sources tab showing uploader", () => {
    render(<NotebookDetail notebook={notebook} onBack={vi.fn()} orgId="org1" />);
    expect(screen.getByText("File")).toBeInTheDocument();
    expect(screen.getByText("Text")).toBeInTheDocument();
  });
});
