import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  HostListener,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { rxResource } from '@angular/core/rxjs-interop';
import { catchError, of } from 'rxjs';
import { PermissionService } from '../../../../../core/service/permission-service';
import { Icon } from '../../../../../shared/ui/icon/icon';
import { VerifyProfessorsService } from '../../data/verify-professors.service';
import {
  PendingVerifyProfessorItem,
  PendingVerifyProfessorsList,
  VERIFY_PROFESSORS_PATH,
  VERIFY_PROFESSORS_QUERY,
  formatPendingBadgeCount,
  pendingCoordinationName,
  pendingProfessorName,
} from '../../model/verify-professors.model';

const EMPTY_PENDING: PendingVerifyProfessorsList = {
  total: 0,
  items: [],
};

const MAX_VISIBLE_ITEMS = 10;

@Component({
  selector: 'app-verify-notifications',
  imports: [Icon],
  templateUrl: './verify-notifications.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class VerifyNotifications {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly router = inject(Router);
  private readonly permissions = inject(PermissionService);
  private readonly verifyProfessorsService = inject(VerifyProfessorsService);

  readonly isOpen = signal(false);
  readonly refreshKey = signal(0);

  readonly pendingProfessorName = pendingProfessorName;
  readonly pendingCoordinationName = pendingCoordinationName;

  readonly canShow = computed(() => this.permissions.canVerifyProfessors());

  readonly pendingResource = rxResource({
    params: () => {
      if (!this.canShow()) {
        return undefined;
      }

      return { key: this.refreshKey() };
    },
    stream: () =>
      this.verifyProfessorsService.listPendingProfessors().pipe(
        catchError(() => of(EMPTY_PENDING)),
      ),
    defaultValue: EMPTY_PENDING,
  });

  readonly pending = computed(
    () => this.pendingResource.value() ?? EMPTY_PENDING,
  );

  readonly total = computed(() => this.pending().total ?? 0);

  readonly hasPending = computed(() => this.total() > 0);

  readonly badgeCount = computed(() =>
    formatPendingBadgeCount(this.total()),
  );

  readonly visibleItems = computed(() =>
    (this.pending().items ?? []).slice(0, MAX_VISIBLE_ITEMS),
  );

  readonly hiddenCount = computed(() =>
    Math.max(this.total() - this.visibleItems().length, 0),
  );

  toggleDropdown(): void {
    const nextOpen = !this.isOpen();
    this.isOpen.set(nextOpen);

    if (nextOpen) {
      this.refreshKey.update((value) => value + 1);
    }
  }

  closeDropdown(): void {
    this.isOpen.set(false);
  }

  onSelectItem(item: PendingVerifyProfessorItem): void {
    this.closeDropdown();
    void this.router.navigate([VERIFY_PROFESSORS_PATH], {
      queryParams: {
        [VERIFY_PROFESSORS_QUERY.PERIODO]: item.idPeriodoUniversidad,
        [VERIFY_PROFESSORS_QUERY.CONVOCATORIA]: item.idConvocatoria,
        [VERIFY_PROFESSORS_QUERY.COORDINACION]: item.idCoordinacion,
      },
    });
  }

  onViewAll(): void {
    this.closeDropdown();
    void this.router.navigate([VERIFY_PROFESSORS_PATH]);
  }

  @HostListener('document:mousedown', ['$event'])
  onDocumentMouseDown(event: MouseEvent): void {
    if (!this.isOpen()) {
      return;
    }

    const target = event.target as Node | null;
    const root = this.elementRef.nativeElement;

    if (root && target && !root.contains(target)) {
      this.closeDropdown();
    }
  }
}
