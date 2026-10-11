import java.io.*;
import java.nio.file.*;
import java.nio.charset.StandardCharsets;
import java.util.*;
import java.util.function.*;
import java.util.regex.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.sql.*;

public class Demo {
    static final class StudentId {
        private final int value;
        StudentId(int value) { this.value = value; }
        @Override public boolean equals(Object other) {
            return other instanceof StudentId id && value == id.value;
        }
        @Override public int hashCode() { return Integer.hashCode(value); }
    }

    public static void main(String[] args) throws Exception {
        Set<StudentId> ids = new HashSet<>();
        ids.add(new StudentId(10));
        ids.add(new StudentId(10));
        System.out.println(ids.size());
    }
}
