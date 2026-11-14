import glob

total = 0
for path in sorted(glob.glob('handover/daily_h_*.csv')):
    n = sum(1 for _ in open(path)) - 1
    total += n
    print(path, n)
print('total rows', total)
