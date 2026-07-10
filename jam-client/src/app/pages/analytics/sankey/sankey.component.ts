import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  ElementRef,
  ViewChild,
  Input,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { JamService } from 'src/app/core/api/jam.service';
import * as d3 from 'd3';
import { sankey, sankeyLinkHorizontal, sankeyJustify } from 'd3-sankey';
import { SankeyData } from 'src/app/interfaces';

@Component({
  selector: 'app-sankey',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './sankey.component.html',
  styleUrls: ['./sankey.component.scss'],
})
export class SankeyComponent
  implements OnInit, AfterViewInit, OnDestroy, OnChanges
{
  @Input() selectedGroup: string = 'all';

  loading = false;
  sankeyData: SankeyData | null = null;
  hasData = false;

  @ViewChild('sankeyContainer') sankeyContainer:
    | ElementRef<HTMLDivElement>
    | undefined;

  private getCssVar(name: string): string {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#000';
  }

  private renderTimeout: any = null;

  constructor(private jamService: JamService) {}

  ngOnInit(): void {
    this.fetchSankeyData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedGroup'] && !changes['selectedGroup'].firstChange) {
      this.fetchSankeyData();
    }
  }

  ngAfterViewInit(): void {
    if (this.sankeyData) {
      this.renderSankeyDiagram();
    }
  }

  ngOnDestroy(): void {
    if (this.renderTimeout) {
      clearTimeout(this.renderTimeout);
      this.renderTimeout = null;
    }
  }

  fetchSankeyData(): void {
    this.loading = true;
    this.sankeyData = null;
    this.hasData = false;

    this.jamService.getSankeyData(this.selectedGroup).subscribe({
      next: (data: any) => {
        this.loading = false;
        this.sankeyData = data;
        this.hasData = data?.nodes?.length > 0;
        this.renderTimeout = setTimeout(() => this.renderSankeyDiagram(), 0);
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading sankey data:', error);
      },
    });
  }

  private renderSankeyDiagram(): void {
    if (
      !this.sankeyContainer?.nativeElement ||
      !this.sankeyData ||
      !this.sankeyData.nodes ||
      !this.sankeyData.nodes.length
    ) {
      return;
    }

    const container = this.sankeyContainer.nativeElement;
    container.innerHTML = '';

    const graph: any = {
      nodes: this.sankeyData.nodes.map((n) => ({
        name: n.name,
        invisible: (n as any).invisible || false,
      })),
      links: this.sankeyData.links.map((l) => ({
        source: l.source,
        target: l.target,
        value: l.value,
      })),
    };

    // Fixed compact dimensions - fits in a single card view
    const margin = { top: 16, right: 160, bottom: 16, left: 160 };
    const containerWidth = Math.max(container.clientWidth || 700, 600);
    const width = containerWidth;
    // Count only visible nodes for height calculation
    const visibleNodeCount = this.sankeyData.nodes.filter(
      (n) => !(n as any).invisible
    ).length;
    const height = Math.min(Math.max(320, visibleNodeCount * 60), 520);

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3
      .select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${width} ${height}`)
      .style('width', '100%')
      .style('height', 'auto')
      .style('overflow', 'visible');

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Build color map and invisible set
    const colorMap = new Map<string, string>();
    const invisibleNodeNames = new Set<string>();
    this.sankeyData.nodes.forEach((node) => {
      colorMap.set(node.name, node.color || '#8c8c8c');
      if ((node as any).invisible) {
        invisibleNodeNames.add(node.name);
      }
    });

    // Sankey layout
    const sankeyGenerator = sankey()
      .nodeWidth(12)
      .nodePadding(12)
      .nodeAlign(sankeyJustify)
      .extent([
        [0, 0],
        [innerWidth, innerHeight],
      ]);

    let nodes: any[] = [];
    let links: any[] = [];
    try {
      const result = sankeyGenerator(graph);
      nodes = result.nodes;
      links = result.links;
    } catch (error) {
      console.error('Sankey layout failed:', error);
      return;
    }

    // Filter out links that connect to invisible nodes
    const visibleLinks = links.filter(
      (d: any) =>
        !invisibleNodeNames.has((d.target as any).name) &&
        !invisibleNodeNames.has((d.source as any).name)
    );

    // Filter out invisible nodes from rendering
    const visibleNodes = nodes.filter(
      (d: any) => !invisibleNodeNames.has(d.name)
    );

    // Defs: subtle shadow for nodes
    const defs = svg.append('defs');
    const shadowFilter = defs
      .append('filter')
      .attr('id', 'node-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');
    shadowFilter
      .append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 1)
      .attr('stdDeviation', 2)
      .attr('flood-color', 'rgba(0,0,0,0.18)');

    // Draw links as stroked paths (standard professional approach)
    // Link width is proportional to the target node's height (d.width from d3-sankey)
    const linkGroup = g.append('g').attr('class', 'links').attr('fill', 'none');

    const linkPaths = linkGroup
      .selectAll('path')
      .data(visibleLinks)
      .join('path')
      .attr('d', sankeyLinkHorizontal())
      .attr(
        'stroke',
        (d: any) => colorMap.get((d.source as any).name) || '#aaa'
      )
      .attr('stroke-width', (d: any) => Math.max(1, d.width))
      .attr('stroke-opacity', 0.35)
      .style('cursor', 'default');

    // Tooltip on links
    linkPaths
      .append('title')
      .text(
        (d: any) =>
          `${(d.source as any).name} → ${(d.target as any).name}: ${d.value}`
      );

    // Link hover - increase opacity while maintaining proportional width
    linkPaths
      .on('mouseover', function (event: any, d: any) {
        d3.select(this)
          .attr('stroke-opacity', 0.6)
          .attr('stroke-width', Math.max(1.5, d.width + 1));
      })
      .on('mouseout', function (event: any, d: any) {
        d3.select(this)
          .attr('stroke-opacity', 0.35)
          .attr('stroke-width', Math.max(1, d.width));
      });

    // Draw nodes
    const nodeGroup = g.append('g').attr('class', 'nodes');

    const nodeEl = nodeGroup
      .selectAll('g')
      .data(visibleNodes)
      .join('g')
      .attr('transform', (d: any) => `translate(${d.x0},${d.y0})`);

    // Node rects
    nodeEl
      .append('rect')
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => Math.max(d.y1 - d.y0, 4))
      .attr('fill', (d: any) => colorMap.get(d.name) || '#8c8c8c')
      .attr('rx', 3)
      .attr('stroke', 'none')
      .style('filter', 'url(#node-shadow)')
      .append('title')
      .text((d: any) => `${d.name}: ${d.value} applications`);

    // Node name labels (always outside the node)
    nodeEl
      .append('text')
      .attr('x', (d: any) => {
        const isLeft = d.x0 < innerWidth / 2;
        return isLeft ? d.x1 - d.x0 + 8 : -8;
      })
      .attr('y', (d: any) => (d.y1 - d.y0) / 2)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) =>
        d.x0 < innerWidth / 2 ? 'start' : 'end'
      )
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .attr('fill', this.getCssVar('--color-sankey-label'))
      .style('pointer-events', 'none')
      .text((d: any) => d.name);

    // Value badge next to label
    nodeEl
      .append('text')
      .attr('x', (d: any) => {
        const isLeft = d.x0 < innerWidth / 2;
        return isLeft ? d.x1 - d.x0 + 8 : -8;
      })
      .attr('y', (d: any) => (d.y1 - d.y0) / 2 + 15)
      .attr('dy', '0.35em')
      .attr('text-anchor', (d: any) =>
        d.x0 < innerWidth / 2 ? 'start' : 'end'
      )
      .attr('font-size', '10.5px')
      .attr('fill', this.getCssVar('--color-sankey-badge'))
      .style('pointer-events', 'none')
      .text((d: any) => `${d.value} apps`);
  }
}
