import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

class GuideDashboardScreen extends StatefulWidget {
  const GuideDashboardScreen({Key? key}) : super(key: key);

  @override
  State<GuideDashboardScreen> createState() => _GuideDashboardScreenState();
}

class _GuideDashboardScreenState extends State<GuideDashboardScreen> {
  void _simulateIncomingDispatch() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.white,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.notification_important, color: AppTheme.primaryContainer),
            SizedBox(width: 8),
            Text('Escort Dispatch Alert', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 17)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'A solo traveler requested an Audio Guard Escort near your radius.',
              style: TextStyle(fontSize: 14, color: AppTheme.onSurfaceVariant),
            ),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppTheme.surfaceContainer,
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Traveler: Karthik • Rating 4.9★', style: TextStyle(fontWeight: FontWeight.w700, fontSize: 13)),
                  SizedBox(height: 4),
                  Text('Destination: Campus Main Gate', style: TextStyle(fontSize: 12, color: AppTheme.onSurfaceVariant)),
                  SizedBox(height: 4),
                  Text('Estimated Fare: \$8.00 (15 min walk)', style: TextStyle(fontWeight: FontWeight.w700, color: AppTheme.primary, fontSize: 13)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Decline', style: TextStyle(color: Colors.red)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: AppTheme.secondary),
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Accept & Escort'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = context.watch<AppState>();

    return Scaffold(
      backgroundColor: AppTheme.surface,
      appBar: AppBar(
        title: const Text('Guide Companion Portal'),
        actions: [
          IconButton(
            icon: const Icon(Icons.swap_horiz),
            tooltip: 'Switch to Traveler View',
            onPressed: () {
              state.setUserRole('traveler');
            },
          ),
        ],
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(20),
          children: [
            // Availability Status Banner
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: state.guideIsOnline ? AppTheme.secondary : const Color(0xFF6B7280),
                borderRadius: BorderRadius.circular(20),
                boxShadow: [
                  BoxShadow(
                    color: (state.guideIsOnline ? AppTheme.secondary : Colors.grey).withOpacity(0.3),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Icon(
                    state.guideIsOnline ? Icons.radar : Icons.power_settings_new,
                    color: Colors.white,
                    size: 32,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          state.guideIsOnline ? 'YOU ARE ONLINE' : 'YOU ARE OFFLINE',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 16,
                            fontWeight: FontWeight.w900,
                          ),
                        ),
                        const SizedBox(height: 2),
                        Text(
                          state.guideIsOnline
                              ? 'Broadcasting live availability to travelers'
                              : 'Not receiving new escort requests',
                          style: const TextStyle(
                            color: Colors.white70,
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Switch(
                    value: state.guideIsOnline,
                    activeColor: Colors.white,
                    onChanged: (val) => state.toggleGuideOnline(),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),
            // Today's Stats Cards
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Earnings Today',
                    value: '\$64.00',
                    icon: Icons.account_balance_wallet_outlined,
                    color: AppTheme.primary,
                  ),
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: _StatCard(
                    title: 'Completed',
                    value: '8 Trips',
                    icon: Icons.check_circle_outline,
                    color: AppTheme.secondary,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            // Dispatch Testing
            const Text(
              'Escort Simulator',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: AppTheme.onSurface),
            ),
            const SizedBox(height: 12),
            ElevatedButton.icon(
              onPressed: _simulateIncomingDispatch,
              icon: const Icon(Icons.ring_volume),
              label: const Text('Simulate Incoming Escort Dispatch'),
            ),
          ],
        ),
      ),
    );
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        border: Border.all(color: const Color(0xFFE2E7FF)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 12),
          Text(
            value,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(
              fontSize: 12,
              color: AppTheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}
